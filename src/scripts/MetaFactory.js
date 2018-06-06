const id3 = require('node-id3');
const fs = require('fs');

const dir = '../../../..';
const bankOutputDir = './';

/* Returns a promise that contains an array of files in a folder */
const getFilesInFolder = directory => new Promise((resolve, reject) => {
  fs.readdir(directory, (err, files) => {
    if (err) { reject(new Error('Error. Please check your path name.')); }
    resolve(files);
  });
});

/* Returns an object of necessary tags of a single file */
const getFileTags = name => new Promise((resolve, reject) => {
  if (!['mp3', 'm4a'].includes(name.substr(name.length - 3))) { resolve(null); }
  const tags = id3.read(`${dir}${name}`);
  resolve({
    filePath: name,
    title: tags.title,
    album: tags.album,
    artist: tags.artist,
    artPath: `${tags.artist}${tags.album}.jpg`.replace(/ /g,'')
  });
});

/* Returns an object of the album art's buffer. The artist and album name
* are used to check if the image is a replicate without the hassle of
* comparing two buffers. They are also used to name the image file after
* it being extracted. */
const getFileAlbumBuffer = name => new Promise((resolve, reject) => {
  if (name.substr(name.length - 4) !== '.mp3') { resolve(null); }
  const tags = id3.read(`${dir}${name}`);
  resolve({
    pathName: `${tags.artist}${tags.album}.jpg`.replace(/ /g,''),
    imageBuffer: tags.raw.APIC.imageBuffer
  });
});

/* Take an object of image buffer and the name of that buffer then
* write it to disc */
const createImageFromBuffer = obj => new Promise((resolve, reject) => {
  fs.writeFile(dir + obj.pathName, obj.imageBuffer, 'base64', err => {
    reject(new Error('Image could not be created.'));
  });
  resolve();
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
    fileString += `    file: require(\`@/assets/music/${file.filePath}\`),\n`;
    fileString += `    title: \`${file.title}\`,\n`;
    fileString += `    album: \`${file.album}\`,\n`;
    fileString += `    artist: \`${file.artist}\`,\n`;
    fileString += `    art: require(\`@/assets/music/${file.artPath}\`)\n`;
    fileString += `  }${arr.indexOf(file) === arr.length - 1 ? '' : ','}\n`;
  }
  fileString += '];\n';
  fs.writeFile(`${bankOutputDir}SongBank.ts`, fileString, err => {
    reject(new Error('File could not be created.'));
  });
  resolve();
});

async function main() {
  console.log('Generating meta file');
  dir += prompt('Please provide the absolute path to your music folder (i.e. /src/assets/music/)');
  const folder = await getFilesInFolder(dir);
  const folderTags = [];
  const albumArtsBuffers = [];
  for (const file of folder) {
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