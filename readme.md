# Caravan Player - VueJS music-playing component

### Please visit this [DEMO PAGE](https://caravan-player.firebaseapp.com/#/) to get an idea of how Caravan Player works.

### Please visit my [GitHub](https://github.com/phiboi/caravan-player) if you're interested in the code.

#### Currenly supports Vue CLI 3.0. It will not work with older versions of Vue CLI.

### Step 1: Put your music files in the designated folder (must be done before installing the package):
Create a folder named 'caravan-player' (case-sensitive) in the 'assets' folder in your Vue project folder. Go to the root of the Vue project and run:
```sh
mkdir ./src/assets/caravan-player
```
##### Put all your music files into this folder. Make sure the mp3 files has the required id3 tags (title, artist name, album name) and an album art.

##### Thanks to a recent update, you can now arrange your music files in different subfolders as long as they're all in the caravan-player folder.

##### Right now only .mp3 files are allowed. I will add more audio extensions support in the future. 

Consider converting your mp3 files to 128kbp to reduce file size and improve loading speed.

### Step 2: Install Caravan Player:
```sh
npm install --save caravan-player
```

### Step 3: Import CaravanPlayer component to your Vue application:

```js
import CaravanPlayer from 'caravan-player/src/CaravanPlayer.vue';
```

#### And voila, Caravan Player is now ready to ride.

## Essential configurations for advanced users

You don't have to follow these steps to make Caravan work. But, if you want to explore its full potential, here are a few things you can do:

##### 1. One optional but very cool feature of Caravan Player is its ability to go stateful. If you want two (or more) instances of Caravan Player to mimic each other's action and share a global audio instance, you'll have to install Vuex (if you haven't already) and add these state and mutation properties to the store.js (or store.ts) file:

```js
state: {
  audio: new Audio(),
  playButton: 'Play',
  currentSong: 0
},
mutations: {
  setCurrentSong(state, index) {
    state.currentSong = index;
  },
  setPlayButton(state, buttonLabel) {
    state.playButton = buttonLabel;
  }
}
```

And when you create a new CaravanPlayer instance, just add a *stateful* prop and you're ready to go:

```html
<CaravanPlayer stateful/>
```

##### 2. Remember, every time you add a new song to the folder after the first install, the song won't be updated automatically. You can fix that by adding this to the project's package.json file:
```json
"scripts": {
  "resync": "node ./node_modules/caravan-player/src/scripts/MetaFactory.js resync"
}
```
Then, every time you add a new song, just run:
```sh
npm run resync
```
And your new song will get updated. If you run into any trouble doing this, just reinstall Caravan.

### As of now, the beta Caravan Player supports two types of music player:

### The "footer" player:

```js
<CaravanPlayer type="footer"/>
```

Plug this component to the root of your Vue app (typically in App.vue) and you'll have a music player that will stick to your website no matter which router you navigate to.

### The "card" player:

```js
<CaravanPlayer type="card" width="600px" height="400px"/>
```
You can put a card player anywhere on your app as a relatively positioned music player. If the width and height props is not provided, the card player will fall back to default width of 90% and height of 400px.

Enjoy! Send me an email at hambaga1234@gmail.com if you have any question.
