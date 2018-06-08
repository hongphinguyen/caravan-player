<template>
  <div :class="`player ${color}`" :style="wrapperStyle">
    <div v-if="playerType === 'static'" :class="`music-player-static ${type}`">
      <img class="player-icon" :src="volumeIcon" @click="onVolumeButtonClick" v-if="!noVolume">
      <img class="player-icon" :src="require('@/assets/icons/Previous.png')" 
           @click="nextOrPreviousSong(false)" alt="">
      <img class="player-icon" :src="playIcon" @click="playOrPause" alt="">
      <img class="player-icon" :src="require('@/assets/icons/Skip.png')" 
           @click="nextOrPreviousSong(true)" style="margin-right: 20px" alt="">
      <div class="song-duration-start">
        <span>{{currentTimeToDisplay}}</span>
      </div>
      <Slider :boundValue="duration" :size="{ height: '30%', width: `${progressBarWidth}%` }"
              :additionalStyle="{ margin: '0 20px 0 20px' }" orientation="horizontal" :color="colorSet[color]"
              :clickEvent="{ event: (percentage) => audio.currentTime = percentage * audio.duration }"/>
      <div class="song-duration-end">
        <span>{{ durationToDisplay }}</span>
      </div>
      <img class="player-icon shuffle" :src="require('@/assets/icons/Shuffle.png')" 
           @click="shuffle" alt="">
      <div class="art-and-info-field" @click="showCatalogue" ref="infofield">
        <img class="song-art" :src="songBank[currentSong].art" alt="">
        <div class="song-info">
          <p style="color: #aaaaaa; font-style: italic;">{{currentSongArtist}}</p>
          <p>{{currentSongTitle}}</p>
        </div>
      </div>
      <div class="catalogue" v-if="catalogue" :style="catalogueGroupSet">
        <input v-if="!noSearch" type="text" placeholder="Search a song..."
               class="search-input" v-model="searchQuery"/>
        <div @click="changeSongTo(songBank.indexOf(song)); catalogue = !catalogue;"
             :class="`catalogue-item ${checkIfHighlight(song)} ${hiddenOnSearch(song)}`"
             v-for="(song, x) in songBank" :key="x">
          <div class="catalogue-art">
            <img :src="song.art"/>
          </div>
          <div class="catalogue-title">
            <span>{{song.title}}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="type === 'card'" :class="`music-player-instance card`">
      <div class="song-info" 
           @mouseover="cardHovered = !cardHovered"
           @mouseout="cardHovered = !cardHovered">
        <img :src="songBank[currentSong].art" :class="{ hovered: cardHovered }" alt="">
        <div class="song-icon-overlay" @click="playOrPause">
          <img :src="playIcon" v-if="cardHovered">
        </div>
        <div class="song-meta">
          <span>{{currentTimeToDisplay}} - {{durationToDisplay}} | </span>
          <span>{{currentSongTitle}} - {{currentSongArtist}}</span>
        </div>
      </div>
      <div class="control">
        <img class="player-icon" :src="volumeIcon" @click="onVolumeButtonClick" v-if="!noVolume">
        <img class="player-icon" :src="require('@/assets/icons/Search.png')"
             @click="searchMode = !searchMode" v-if="!noSearch">
        <input v-if="searchMode" class="search-input" v-model="searchQuery"
               type="text" :style="{ height: '45%', width: `calc(${progressBarWidth}% - 10px)` }"
               @keyup.esc="searchMode = !searchMode" placeholder="Search a song..."/>
        <Slider v-else :additionalStyle="{ margin: '0 15px 0 15px' }" :boundValue="duration" :color="colorSet[color]"
                orientation="horizontal" :size="{ height: '30%', width: `${progressBarWidth}%`}"
                :clickEvent="{ event: (percentage) => audio.currentTime = percentage * audio.duration }"/>
        <img class="player-icon" :src="require('@/assets/icons/Previous.png')" 
             @click="nextOrPreviousSong(false)" alt="">
        <img class="player-icon" :src="require('@/assets/icons/Skip.png')" 
             @click="nextOrPreviousSong(true)" alt="">
        <img class="player-icon" :src="require('@/assets/icons/Shuffle.png')"
             @click="shuffle" alt="">
        </div>
      <div class="catalogue">
        <div :class="`catalogue-item ${checkIfHighlight(song)} ${hiddenOnSearch(song)}`"
             @click="changeSongTo(songBank.indexOf(song)); catalogue = !catalogue;"
             v-for="(song, x) in songBank" :key="x">
          <div class="catalogue-art"><img :src="song.art"/></div>
          <div class="catalogue-title"><span>{{song.artist}} - {{song.title}}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mod, randRange } from './scripts/MathTool';
import { clearInterval, setInterval } from 'timers';
import { getHHMMSS } from './scripts/TimerTool';
import Slider from './components/Slider.vue';
import { SongBank, SongMetadata } from './scripts/SongBank';

interface MarqueeGroupSet {
  text: string;
  intervalObj: any;
  counter: number;
  initial: boolean;
  keyword: string;
}

@Component({
  components: { Slider }
})
export default class CaravanPlayer extends Vue {
  @Prop({ default: 'footer' }) private type!: string;
  @Prop() private noMarquee!: boolean;
  @Prop({ default: false }) private stateful!: boolean;
  @Prop({ default: '500px' }) private height!: string;
  @Prop({ default: '90%' }) private width!: string;
  @Prop({ default: 'blue' }) private color!: string;
  @Prop({ default: false }) private noVolume!: boolean;
  @Prop({ default: false }) private noSearch!: boolean;
  private songBank = SongBank;
  private timeUpdateListener: any;
  private duration = 0;
  private currentTimeToDisplay = '00:00:00';
  private durationToDisplay = '00:00:00';
  private progressBarWidth = this.playerType === 'static' ? 35 : 55;
  private maxTextLength = 15;
  private searchMode = false;
  private searchQuery = '';
  private statelessGroupSet = {
    audio: new Audio(),
    playButton: 'Play',
    currentSong: 0
  }
  private volumeIcon: NodeRequire = require('@/assets/icons/VolumeHigh.png');
  private colorSet = {
    blue: '#293c50',
    orange: '#d49113',
    green: '#17775f',
    purple: '#2f103d'
  }
  private mqTitle: MarqueeGroupSet = {
    text: '',
    intervalObj: setInterval(() => {/*Does nothing*/}, 100000),
    counter: 0,
    initial: false,
    keyword: 'title'
  };
  private mqArtist: MarqueeGroupSet = {
    text: '',
    intervalObj: setInterval(() => {/*Does nothing*/}, 100000),
    counter: 0,
    initial: false,
    keyword: 'artist'
  };
  private catalogueGroupSet = {
    width: '0px',
    left: '0px',
    bottom: '0px',
    height: '300px'
  };
  private cardHovered = false;
  private catalogue = false;
  private showCatalogue(): void {
    const ref: any = this.$refs.infofield;
    if (!this.catalogue) {
      this.catalogueGroupSet.width = `${ref.clientWidth}px`;
      this.catalogueGroupSet.left = `${ref.offsetLeft}px`;
      this.catalogueGroupSet.bottom = `${ref.offsetHeight + 3}px`;
    }
    this.catalogue = !this.catalogue;
  }
  private hiddenOnSearch(song: SongMetadata): object {
    return {
      hidden: this.searchQuery.length > 0
              && !song.artist.toLowerCase().match(this.searchQuery.toLowerCase())
              && !song.title.toLowerCase().match(this.searchQuery.toLowerCase())
    };
  }
  get playIcon(): NodeRequire {
    return this.playButton === 'Play' ? require('@/assets/icons/Play.png') :
      require('@/assets/icons/Pause.png');
  }
  get playerType(): string {
    switch (this.type) {
      case 'footer': case 'header':
        return 'static';
      default:
        return 'instance';
    }
  }
  get wrapperStyle(): object {
    return this.playerType === 'instance' ? {
      width: this.width,
      height: this.height,
      display: 'inline-block',
      boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12)'
    } : {};
  }
  get currentSongTitle(): string {
    const title = this.songBank[this.currentSong].title;
    if (!this.noMarquee && this.type === 'footer' || this.type === 'header') {
      if (title.length >= this.maxTextLength && !this.mqTitle.initial) {
        this.mqTitle.text = title.substr(0, this.maxTextLength);
        this.mqTitle.initial = true;
        return this.mqTitle.text;
      } else if (title.length >= this.maxTextLength && this.mqTitle.initial) {
        return this.mqTitle.text;
      }
    }
    return title;
  }
  get currentSongArtist(): string {
    const artist = this.songBank[this.currentSong].artist;
    if (artist.length >= this.maxTextLength) {
      this.mqArtist.text = artist.substr(0, this.maxTextLength);
      return this.mqArtist.text;
    }
    return artist;
  }
  // State getters
  get audio(): HTMLAudioElement {
    return this.stateful ? this.$store.state.audio : this.statelessGroupSet.audio;
  }
  get playButton(): string { 
    return this.stateful ? this.$store.state.playButton : this.statelessGroupSet.playButton;
  }
  get currentSong(): number {
    this.resetMarquee(this.mqTitle);
    this.resetMarquee(this.mqArtist);
    return this.stateful ? this.$store.state.currentSong : this.statelessGroupSet.currentSong;
  }
  private checkIfHighlight(song: SongMetadata): string {
    if (this.songBank.indexOf(song) === this.currentSong) {
      return 'playing';
    }
    return '';
  }
  private onVolumeButtonClick(): void {
    switch (this.audio.volume) {
      case 0:
        this.volumeIcon = require('@/assets/icons/VolumeLow.png');
        this.audio.volume = 0.5;
        break;
      case 0.5:
        this.volumeIcon = require('@/assets/icons/VolumeHigh.png');
        this.audio.volume = 1;
        break;
      case 1:
        this.volumeIcon = require('@/assets/icons/VolumeMute.png');
        this.audio.volume = 0;
        break;
    }
  }
  private created(): void {
    this.audio.src = this.songBank[0].file;
    this.timeUpdateListener = () => {
      const current = this.audio.currentTime;
      const total = this.audio.duration;
      this.duration = current / total * 100;
      this.currentTimeToDisplay = getHHMMSS(Math.ceil(this.audio.currentTime));
      this.durationToDisplay = getHHMMSS(Math.ceil(this.audio.duration));
      if (current === total) {
        this.nextOrPreviousSong(true);
      }
    };
    this.audio.addEventListener('timeupdate', this.timeUpdateListener);
    this.setMarquee(this.mqTitle, this.mqTitle.keyword);
    this.setMarquee(this.mqArtist, this.mqArtist.keyword);
  }
  private setMarquee(marqueeGroupSet: MarqueeGroupSet, mode: string): void {
    if (this.noMarquee || this.type !== 'footer' && this.type !== 'header') { return; }
    clearInterval(marqueeGroupSet.intervalObj);
    marqueeGroupSet.intervalObj = setInterval(() => {
      let original = '';
      switch (mode) {
        case 'title': original = this.songBank[this.currentSong].title; break;
        case 'artist': original = this.songBank[this.currentSong].artist; break;
      }
      if (original.length <= this.maxTextLength) { return; }
      marqueeGroupSet.text = original.substring(
        marqueeGroupSet.counter, this.maxTextLength + marqueeGroupSet.counter);
      if (marqueeGroupSet.counter === original.length - this.maxTextLength) {
        marqueeGroupSet.counter = 0;
      } else { marqueeGroupSet.counter++; }
    }, 1000);
  }
  private resetMarquee(marqueeGroupSet: MarqueeGroupSet): void {
    if (this.noMarquee) { return; }
    marqueeGroupSet.initial = false;
    marqueeGroupSet.counter = 0;
    marqueeGroupSet.text = '';
    clearInterval(marqueeGroupSet.intervalObj);
    this.setMarquee(marqueeGroupSet, marqueeGroupSet.keyword);
  }
  private onDestroy(): void {
    this.audio.pause();
    this.audio.removeEventListener('timeupdate', this.timeUpdateListener);
    clearInterval(this.mqTitle.intervalObj);
    clearInterval(this.mqArtist.intervalObj);
  }
  private playOrPause(): void {
    if (this.audio.paused) {
      this.audio.play();
      this.togglePlayPause(false);
    } else {
      this.audio.pause();
      this.togglePlayPause(true);
    }
  }
  private nextOrPreviousSong(increment: boolean): void {
    const song = mod(this.currentSong + (increment ? 1 : -1), this.songBank.length);
    this.changeSongTo(song);
  }
  private shuffle() {
    this.changeSongTo(randRange(0, this.songBank.length));
  }
  private changeSongTo(index: number): void {
    if (this.stateful) {
      this.$store.commit('setCurrentSong', index);
    } else {
      this.statelessGroupSet.currentSong = index;
    }
    this.audio.src = this.songBank[index].file;
    if (!this.audio.paused) { return; }
    if (this.audio.paused) {
      this.audio.play();
      this.togglePlayPause(false);
    }
  }
  private togglePlayPause(play: boolean) {
    let playPause;
    playPause = play ? 'Play' : 'Pause';
    if (this.stateful) {
      this.$store.commit('setPlayButton', playPause);
    } else {
      this.statelessGroupSet.playButton = playPause
    }
  }
}
</script>

<style lang="scss">

$colors: (
  green: #17775f,
  blue: #293c50,
  orange: #d49113,
  purple: #2f103d
);

@font-face {
  font-family: 'Iosevka';
  src: url('./assets/fonts/Iosevka/iosevka-regular.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}

* {
  font-family: 'Iosevka', Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@each $colors, $primary in $colors {
  .player.#{$colors} {

    .music-player-static.footer { bottom: 0; }
    .music-player-static.header { top: 0; }

    .music-player-static {
      background-color: $primary;
      height: 50px;
      color: white;
      position: fixed;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99;

      .player-icon {
        height: 24px;
        cursor: pointer;
        margin: 0 6px 0 6px;
        transition: all .2s ease-in-out;
      }

      .player-icon:hover { 
        transform: scale(1.2, 1.2);
      }

      .progress-bar {
        height: 30%;
        background-color: white;
        padding: 1px;
        margin: 0 20px 0 20px;
        cursor: pointer;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
      }

      .progress-bar-inner {
        height: 100%;
        background-color: $primary;
      }

      .song-info {
        margin-left: 12px;
        width: 155px;
      }

      .song-info p {
        font-size: 14px;
        line-height: 3px;
      }

      .song-duration-end {
        margin-right: 10px;
      }

      .song-art {
        height: 40px;
        width: auto;
        margin-left: 20px;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
      }

      .art-and-info-field {
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .art-and-info-field:hover {
        background-color: darken($primary, 10%);
        cursor: pointer;
      }

      ::-webkit-scrollbar {
        width: 0.7em;
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: darken($primary, 5%);
      }

      ::-webkit-scrollbar-corner {
        background-color: $primary;
      }

      .art-and-info-field:active {
        background-color: darken($primary, 10%);
      }

      .catalogue {
        position: fixed;
        background-color: $primary;
        overflow-y: scroll;
        overflow-x: hidden;
        z-index: 80;

        .search-input {
          padding-left: 10px;
          background-color: $primary;
          color: white;
          width: 100%;
          height: 30px;
          font-size: 14px;
          font-family: 'Iosevka', Helvetica, san-serif;
          border: none;
          outline: none;
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
        }

        .search-input::placeholder {
          color: rgb(177, 177, 177);
        }

        .catalogue-item.hidden { display: none; }

        .catalogue-item {
          width: 100%;
          height: 40px;
          display: grid;
          grid-template-columns: 8% 90%;
          font-size: 12px;

          .catalogue-art {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 20px 0 20px;
            img { height: 20px; }
          }

          .catalogue-title {
            display: flex;
            align-items: center;
            margin: 0 20px 0 20px;
          }
        }

        .catalogue-item:hover {
          background-color: darken($primary, 5%);
          cursor: pointer;
        }

        .catalogue-item.playing {
          background-color: darken($primary, 10%);
        }
      }

      @media (max-width: 600px) {
        .player-icon.shuffle { display: none; }
        .progress-bar { margin: 0; }
      }

      @media (max-width: 680px) {
        .song-duration-end { display: none; }
        .song-duration-start { display: none; }
      }
    }

    .music-player-instance.card {
      height: 100%;
      width: 100%;
      background-color: $primary;
      display: grid;
      grid-template-rows: 200px 40px 260px;

      ::-webkit-scrollbar {
        width: 0.7em;
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: darken($primary, 5%);
      }
      ::-webkit-scrollbar-corner {
        background-color: $primary;
      }

      .search-input {
        background: white;
        font-size: 14px;
        margin: 0 15px 0 15px;
        padding:  0 5px 0 5px;
        font-family: 'Iosevka', Helvetica, san-serif;
        border: none;
        outline: none;
        box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
      }

      .song-info {
        overflow: hidden;
        display: flex;
        align-items: center;
        position: relative;
        background: $primary;
        outline: 0;
        img {
          position: absolute;
          z-index: 10;
          width: 100%;
          transition: all .2s ease-in-out;
        }
        .hovered { 
          transform: scale(1.2, 1.2);
        }
        .song-icon-overlay {
          position: absolute;
          z-index: 15;
          top: 0;
          height: 100%;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;

          img {
            height: 30%;
            width: auto;
          }
        }
        .song-meta {
          padding-left: 10px;
          color: rgb(187, 185, 185);
          position: absolute;
          bottom: 0;
          left: 0;
          height: 20px;
          width: 100%;
          z-index: 20;
          background-color: rgba(0, 0, 0, 0.288);
        }
      }

      .control {
        display: flex;
        align-items: center;
        justify-content: center;

        .progress-bar {
          height: 30%;
          background-color: white;
          padding: 1px;
          margin: 0 20px 0 20px;
          cursor: pointer;
          box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12);
        }

        .progress-bar-inner {
          height: 100%;
          background-color: $primary;
        }

        .player-icon {
          height: 24px;
          cursor: pointer;
          transition: all .2s ease-in-out;
          margin: 0 6px 0 6px;
        }
        .player-icon:hover { 
          transform: scale(1.2, 1.2);
        }    
      }

      .catalogue {
        background-color: $primary;
        overflow-y: scroll;
        overflow-x: hidden;
        z-index: 80;
        width: 100%;
        height: 100%;
        color: white;

        .catalogue-item.hidden { display: none; }

        .catalogue-item {
          width: 100%;
          height: 40px;
          display: grid;
          grid-template-columns: 8% 90%;
          font-size: 16px;

          .catalogue-art {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 20px 0 20px;
            
            img { height: 20px; }
          }

          .catalogue-title {
            display: flex;
            align-items: center;
            margin: 0 20px 0 20px;
          }
        }

        .catalogue-item:hover {
          background-color: darken($primary, 5%);
          cursor: pointer;
        }

        .catalogue-item.playing {
          background-color: darken($primary, 10%);
        }
      }
    }
  }
}
</style>