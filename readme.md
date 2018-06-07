# Caravan Player - VueJS music-playing component

#### Please visit this [DEMO PAGE](https://caravan-player.firebaseapp.com/#/) to get an idea of how Caravan Player works.

#### Currenly supports Vue CLI 3.0. It will not work with older versions of Vue CLI.

### Step 1: Put your music files in the designated folder (must be done before installing the package):
Create a folder named 'caravan-player' (case-sensitive) in the 'assets' folder in your Vue project folder. The path to your music files now should be:
```sh
./src/assets/caravan-player
```
Put all your music files into this folder.  Make sure the mp3 file has the required id3 tags and an album art.

#####  Right now only .mp3 files are allowed. I will add more audio extensions support in the future.

### Step 2: Install Caravan Player:
```sh
npm install --save caravan-player
```

### Step 3: Import CaravanPlayer component to your Vue application:

```js
import CaravanPlayer from 'caravan-player/src/CaravanPlayer.vue'
```

#### And voila, Caravan Player is now ready to ride.

##### OPTIONAL: Remember, every time you add a new song to the folder after the first install, the song won't be updated automatically. You can fix that by adding this to the project's package.json file:
```json
"scripts": {
  "resync": "node ./node_modules/caravan-player/src/scripts/MetaFactoryRerun"
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

Enjoy! Send me an email if you have any question.
