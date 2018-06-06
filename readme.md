# Caravan Player

#### Please visit this [DEMO PAGE](https://caravan-player.firebaseapp.com/#/) to get an idea of how Caravan Player works.

#### Currenly supports Vue CLI 3.0. It will not work with older versions of Vue CLI.

### Step 1: Install Caravan Player:
```sh
npm install --save caravan-player
```
### Step 2: Put your music your files in the right folder:
Create a folder named 'caravan-player' (case-sensitive) in the 'assets' folder in your Vue project folder. The path to your music files now should be:
```sh
./src/assets/caravan-player
```
Put all your music files into this folder.  Make sure the mp3 file has the required id3 tags and an album art.

##### You have to redo this step everytime you make an update to a newer Caravan Player version.

#####  Right now only .mp3 files are allowed. I will add more audio extensions support in the future.

### Step 3: Run this script file:

```ts
cd ./node_modules/caravan-player/src/scripts
node MetaFactory
```

### Step 4: Import CaravanPlayer component to your Vue application:

```js
import CaravanPlayer from 'caravan-player/src/CaravanPlayer.vue'
```

#### As of now, the beta Caravan Player supports two types of music player:

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
