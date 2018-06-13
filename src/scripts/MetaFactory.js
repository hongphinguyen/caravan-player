const id3 = require('node-id3');
const fs = require('fs');

let musicDir = '../../src/assets/caravan-music/';
let bankOutputDir = './src/scripts/';

if (process.argv[2] === 'resync') {
  musicDir = './src/assets/caravan-music/';
  bankOutputDir = './node_modules/caravan-player/src/scripts/';
}

let artDir = musicDir + 'AlbumArtworks/'

/* Returns an object of necessary tags of a single file */
const getFileTags = file => new Promise((resolve, reject) => {
  if (!['mp3', 'm4a'].includes(file.name.substr(file.name.length - 3))) { resolve(null); }
  const tags = id3.read(file.directory);
  resolve({
    filePath: file.name,
    title: tags.title,
    album: tags.album,
    artist: tags.artist,
    artPath: `${(tags.artist + tags.album).replace(/\W/g, '')}.jpg`
  });
});

/* Returns an object of the album art's buffer. The artist and album name
* are used to check if the image is a replicate without the hassle of
* comparing two buffers. They are also used to name the image file after
* it being extracted. */
const getFileAlbumBuffer = file => new Promise((resolve, reject) => {
  if (file.name.substr(file.name.length - 4) !== '.mp3') { resolve(null); }
  const tags = id3.read(file.directory);
  resolve({
    pathName: `${(tags.artist + tags.album).replace(/\W/g, '')}.jpg`,
    imageBuffer: tags.raw.APIC.imageBuffer
  });
});

const filterExclamationMark = file => new Promise((resolve, reject) => {
  if (file.name.includes('!')) {
    fs.rename(file.directory, file.directory.replace('!', ''), () => {
      file.name = file.name.replace('!', '');
      file.directory = file.directory.replace('!', '');
      resolve();
    });
  } else {
    resolve();
  }
});

/* Take an object of image buffer and the name of that buffer then
* write it to disc */
const createImageFromBuffer = obj => new Promise((resolve, reject) => {
  fs.mkdir(artDir, null, () => {
    fs.writeFile(artDir + obj.pathName, obj.imageBuffer, 'base64', err => {
      reject(new Error('Image could not be created.'));
    });
    resolve();
  });
});


/* Write the metadata to the SongBank.ts meta file */
const writeMetaFile = arr => new Promise((resolve, reject) => {
  let fileString = '';
  fileString += 'export interface SongMetadata {\n';
  fileString += '  file: any;\n  title: string;\n  album: string;\n';
  fileString += '  artist: string;\n  art: any;\n}\n\n';
  fileString += 'export const SongBank: SongMetadata[] = [\n';
  for (const file of arr) {
    fileString += '  {\n';
    fileString += `    file: require(\`@/assets/caravan-music/${file.filePath}\`),\n`;
    fileString += `    title: \`${file.title}\`,\n`;
    fileString += `    album: \`${file.album}\`,\n`;
    fileString += `    artist: \`${file.artist}\`,\n`;
    fileString += `    art: require(\`@/assets/caravan-music/AlbumArtworks/${file.artPath}\`)\n`;
    fileString += `  }${arr.indexOf(file) === arr.length - 1 ? '' : ','}\n`;
  }
  fileString += '];\n';
  fs.writeFile(`${bankOutputDir}SongBank.ts`, fileString, err => {
    reject(new Error('File could not be created.'));
  });
  resolve();
});

const getFilesFromFolder = (dir) => new Promise((resolve, reject) => {
  if (!dir) {
    reject('Not a directory');
    return;
  }
  fs.readdir(dir, (err, files) => {
    resolve(files);
  });
});

function checkIfFileIsFolder(file) {
  if (!file) { throw 'Not a file'; }
  return fs.statSync(file).isDirectory();
}

async function readDirectoryRecursively(dir, arr, folder) {
  if (!checkIfFileIsFolder(dir)) {
    throw 'File is not a folder.'
  }
  const totalFiles = [];
  if (!dir) { throw 'Not a directory'; }
  const files = await getFilesFromFolder(dir);
  for (const file of files) {
    if (checkIfFileIsFolder(dir + file)) {
      await readDirectoryRecursively(dir + file + '/', arr || totalFiles, file);
    } else {
      (arr || totalFiles).push({
        name: (dir + file).slice(musicDir.length),
        directory: dir + file
      });
    }
  }
  return arr ? null : totalFiles;
}

async function main() {
  console.log('Generating meta file');
  const folder = await readDirectoryRecursively(musicDir);
  const folderTags = [];
  const albumArtsBuffers = [];
  for (const file of folder) {
    await filterExclamationMark(file);
    const fileTags = await getFileTags(file);
    if (fileTags) { folderTags.push(fileTags); }
    const bufferTags = await getFileAlbumBuffer(file);
    if (bufferTags) {
      let isReplicate = false;
      if (albumArtsBuffers.length !== 0) {
        for (const buffer of albumArtsBuffers) {
          if (bufferTags.pathName !== buffer.pathName) { continue; }
          isReplicate = true;
          break;
        }
      }
      if (!isReplicate) { albumArtsBuffers.push(bufferTags); }
    }
  }
  for (const bufferObj of albumArtsBuffers) {
    await createImageFromBuffer(bufferObj);
  }
  await writeMetaFile(folderTags);
  console.log('Meta file successfully written!');
}

main();