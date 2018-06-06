export interface SongMetadata {
  file: any;
  title: string;
  album: string;
  artist: string;
  art: any;
}

export const SongBank: SongMetadata[] = [
  {
    file: require('../assets/caravan-music/meow.mp3'),
    title: 'Meow',
    album: 'Catville',
    artist: 'A Cat',
    art: require('../assets/caravan-music/ACatCatville.jpg')
  }
];
