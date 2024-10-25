const fs = require("fs");
const path = require("path");

// Function to save buffer as a file
function saveBufferAsImage(buffer, fileName) {

  console.log(fileName, "fileName",buffer);

  // Check if the buffer is defined and has a valid length
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    console.error("Invalid buffer provided.");
    return;
  }

  // Check if fileName is defined
  if (!fileName || typeof fileName !== "string") {
    console.error("Invalid file name provided.");
    return;
  }

  const fullPath = path.resolve(path.join(process.cwd(), "ImagesShared"));

  if (!fs.existsSync(fullPath)) {
    // Create the folder
    fs.mkdir(fullPath, { recursive: true }, (err) => {
      if (err) {
        console.error(`Error creating folder: ${err.message}`);
      } else {
        console.log(`Folder created: ${fullPath}`);
      }
    });
  } else {
    console.log(`Folder already exists: ${fullPath}`);
  }


  let sanitizedName = fileName.replace(/\s+/g, '')
  let updatedFilename = `${sanitizedName.replace(/\s+/g, '').split(".")[0]}-${new Date().getTime()}.${
    sanitizedName.split(".")[1]
  }`;
  const uploadPath = path.join(process.cwd(), "ImagesShared", updatedFilename);

  // Log the upload path for debugging
  console.log("Saving file to:", uploadPath);

  // Write the buffer to a file
  fs.writeFile(uploadPath, buffer, (err) => {
    if (err) {
      console.error("Failed to save the image:", err);
    } else {
      console.log("Image saved successfully!");
    }
  });
  return updatedFilename;
}

module.exports = { saveBufferAsImage };
