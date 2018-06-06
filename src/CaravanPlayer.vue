<template>
  <div id="caravanPlayer" :style="wrapperStyle">
    <div v-if="playerType === 'static'" :class="`music-player ${type ? type : 'footer'}`">
      <img class="player-icon" :src="volumeIcon" @click="onVolumeButtonClick">
      <img class="player-icon" :src="require('@/assets/icons/Previous.png')" 
           @click="nextOrPreviousSong(false)" alt="">
      <img class="player-icon" :src="playIcon" @click="playOrPause" alt="">
      <img class="player-icon" :src="require('@/assets/icons/Skip.png')" 
           @click="nextOrPreviousSong(true)" style="margin-right: 20px" alt="">
      <div class="song-duration-start">
        <span>{{currentTimeToDisplay}}</span>
      </div>
      <Slider :boundValue="duration" :size="{ height: '30%', width: `${progressBarWidth}%` }"
              :additionalStyle="{ margin: '0 20px 0 20px' }" orientation="horizontal" 
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
        <input type="text" placeholder="Search a song..."
               class="search-input" v-model="searchQuery"/>
        <div class="catalogue-item" v-for="(song, x) in songBank" :key="x"
             @click="changeSongTo(songBank.indexOf(song)); catalogue = !catalogue;"
             :style="checkIfHighlight(song)" :class="hiddenOnSearch(song)">
          <div class="catalogue-art">
            <img :src="song.art"/>
          </div>
          <div class="catalogue-title">
            <span>{{song.title}}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else :class="`music-player-instance ${type}`">
      <div class="song-info" 
           @mouseover="cardHovered = !cardHovered"
           @mouseout="cardHovered = !cardHovered">
        <img :src="songBank[currentSong].art" :class="{ hovered: cardHovered }" alt="">
        <div class="song-icon-overlay">
          <img :src="playIcon" v-if="cardHovered" @click="playOrPause">
        </div>
        <div class="song-meta">
          <span>{{currentTimeToDisplay}} - {{durationToDisplay}} | </span>
          <span>{{currentSongTitle}} - {{currentSongArtist}}</span>
        </div>
      </div>
      <div class="control">
        <img class="player-icon" :src="volumeIcon" @click="onVolumeButtonClick">
        <img class="player-icon" :src="require('@/assets/icons/Search.png')"
             @click="searchMode = !searchMode" alt="">
        <input v-if="searchMode" class="search-input" v-model="searchQuery"
               type="text" :style="{ height: '45%', width: `calc(${progressBarWidth}% - 10px)` }"
               @keyup.esc="searchMode = !searchMode" placeholder="Search a song..."/>
        <Slider v-else :additionalStyle="{ margin: '0 15px 0 15px' }" :boundValue="duration"
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
        <div class="catalogue-item" v-for="(song, x) in songBank" :key="x"
             @click="changeSongTo(songBank.indexOf(song)); catalogue = !catalogue;"
             :class="hiddenOnSearch(song)" :style="checkIfHighlight(song)">
          <div class="catalogue-art"><img :src="song.art"/></div>
          <div class="catalogue-title"><span>{{song.artist}} - {{song.title}}</span></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang='ts'>
import { Component, Prop, Vue } from 'vue-property-decorator';
import { mod, randRange } from '@/scripts/MathTool';
import { clearInterval, setInterval } from 'timers';
import { getHHMMSS } from '@/scripts/TimerTool';
import Slider from '@/components/Slider.vue';

interface SongMetadata {
  file: any;
  title: string;
  album: string;
  artist: string;
  art: any;
}

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
  @Prop() private songBank!: SongMetadata[];
  @Prop() private type!: string;
  @Prop() private noMarquee!: boolean;
  @Prop() private stateless!: boolean;
  private timeUpdateListener: any;
  private duration = 0;
  private currentTimeToDisplay = '00:00:00';
  private durationToDisplay = '00:00:00';
  private progressBarWidth = this.playerType === 'static' ? 35 : 55;
  private maxTextLength = 15;
  private searchMode = false;
  private searchQuery = '';
  private volumeIcon: NodeRequire = require('@/assets/icons/VolumeHigh.png');
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
      width: '90%',
      height: '500px',
      display: 'inline-block',
      background: '#354b68',
      boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.16), 0 2px 10px 0 rgba(0, 0, 0, 0.12)'
    } : {};
  }
  get currentSongTitle(): string {
    const title = this.songBank[this.currentSong].title;
    if (!this.noMarquee) {
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
  get audio(): HTMLAudioElement { return this.$store.state.audio; }
  get playButton(): string { return this.$store.state.playButton; }
  get currentSong(): number {
    this.resetMarquee(this.mqTitle);
    this.resetMarquee(this.mqArtist);
    return this.$store.state.currentSong;
  }
  private checkIfHighlight(song: SongMetadata): object {
    if (this.songBank.indexOf(song) === this.currentSong) {
      return { background: '#1f2a36' };
    }
    return {};
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
    if (this.noMarquee) { return; }
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
      this.$store.commit('setPlayButton', 'Pause');
    } else {
      this.audio.pause();
      this.$store.commit('setPlayButton', 'Play');
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
    this.$store.commit('setCurrentSong', index);
    this.audio.src = this.songBank[index].file;
    if (!this.audio.paused) { return; }
    if (this.audio.paused) {
      this.audio.play();
      this.$store.commit('setPlayButton', 'Pause');
    }
  }
}
</script>

<style lang="scss">
$primary-color: #293c50;

.music-player-instance {
  height: 400px;
}

.music-player.footer { bottom: 0; }
.music-player.header { top: 0; }

.music-player {
  background-color: $primary-color;
  height: 50px;
  color: white;
  position: fixed;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
  border-top: 1px solid black;

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
    background-color: $primary-color;
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
    background-color: #263442;
    cursor: pointer;
  }

  ::-webkit-scrollbar {
    width: 0.7em;
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #263442;
  }

  ::-webkit-scrollbar-corner {
    background-color: $primary-color;
  }

  .art-and-info-field:active {
    background-color: #1b242e;
  }

  .catalogue {
    position: fixed;
    background-color: $primary-color;
    overflow-y: scroll;
    overflow-x: hidden;
    z-index: 80;

    .search-input {
      padding-left: 10px;
      background-color: $primary-color;
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
      background-color: #263442;
      cursor: pointer;
    }

    .catalogue-item:active {
      background-color: #1b242e;
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
  background-color: $primary-color;
  display: grid;
  grid-template-rows: 200px 40px 260px;

  ::-webkit-scrollbar {
    width: 0.7em;
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: #263442;
  }
  ::-webkit-scrollbar-corner {
    background-color: $primary-color;
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
    background: $primary-color;
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
      background-color: $primary-color;
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
    background-color: $primary-color;
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
      background-color: #263442;
      cursor: pointer;
    }

    .catalogue-item:active {
      background-color: #1b242e;
    }
  }
}



</style>