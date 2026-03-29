import multer from "multer";

const imageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const iconStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/icons/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const imageFilter = (req, file, cb) => {
  if (imageMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const iconMimeTypes = [...imageMimeTypes, "image/svg+xml"];

/** Achievement icons: raster images + SVG (`image/svg+xml`). */
const iconFileFilter = (req, file, cb) => {
  if (iconMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  const name = file.originalname?.toLowerCase() ?? "";
  if (name.endsWith(".svg")) {
    cb(null, true);
    return;
  }
  cb(new Error("Only image or SVG icon files are allowed!"), false);
};

const videoMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/3gpp",
];

const videoFilter = (req, file, cb) => {
  if (videoMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed!"), false);
  }
};

export const uploadIcon = multer({
  storage: iconStorage,
  fileFilter: iconFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadReelVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});


