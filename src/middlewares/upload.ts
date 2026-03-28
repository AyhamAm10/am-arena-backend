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
    console.log("File received:", file.originalname, file.mimetype);
  if (imageMimeTypes.includes(file.mimetype)) {
    cb(null, true); 
  } else {
    cb(new Error("Only image files are allowed!"), false); 
  }
};

export const uploadIcon = multer({
  storage: iconStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const upload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});


