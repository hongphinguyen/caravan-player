import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    audio: new Audio(),
    playButton: 'Play',
    currentSong: 0
  },
  mutations: {
    setCurrentSong(state, index: number) {
      state.currentSong = index;
    },
    setPlayButton(state, buttonLabel: string) {
      state.playButton = buttonLabel;
    }
  },
  actions: {
  }
});
