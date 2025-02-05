import { Cloudinary } from '@cloudinary/url-gen';

const cld = new Cloudinary({
  cloud: {
    cloudName: 'dfqyj1dub', // Reemplaza con tu Cloud Name
  },
});

export { cld };