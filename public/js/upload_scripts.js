  const modal = new bootstrap.Modal(document.getElementById('alertModal'));
  const modalBody = document.querySelector('#alertModal .modal-body');




 function changeCover() {

  const fileUploadInput = document.querySelector('.file-uploader-img');

  /// Validations ///

  if (!fileUploadInput.value) {
    return;
  }

  // using index [0] to take the first file from the array
  const image = fileUploadInput.files[0];

  // check if the file selected is not an image file
  if (!image.type.includes('image')) {
    modal.show()
    modalBody.innerHTML = "Wrong image file format. Please try again.";
    return;  
  }

  // check if size (in bytes) exceeds 10 MB
  if (image.size > 50_000_000) {
    modal.show()
    modalBody.innerHTML = "Uploaded file is too big (max is 50MB). Please try again.";
    return;  }

  /// Display the image on the screen ///

  const fileReader = new FileReader();
  fileReader.readAsDataURL(image);

  fileReader.onload = (fileReaderEvent) => {
    const coverPicture = document.querySelector('.cover-picture');
    coverPicture.style.backgroundImage = `url(${fileReaderEvent.target.result})`;
  }

  const coverText = document.querySelector('.cover-picture p');
  coverText.innerHTML = `${image.name}<br><br>Click here to change cover for your song.<br>(File should not exceed 50MB)`;
}
let currentFileURL = null;

function uploadMusic() {
  const fileUploadInput = document.querySelector('.file-uploader-mus');
  if (!fileUploadInput.value) {
    return;
  }
  const audio = fileUploadInput.files[0];

  if (!audio.type.includes('audio')) {
    modal.show()
    modalBody.innerHTML = "Wrong audio file format. Please try again.";
    return;
  }
  if (audio.size > 50_000_000) {
    modal.show()
    modalBody.innerHTML = "Uploaded file is too big (max is 50MB). Please try again.";
    return;
  }
  if (currentFileURL) {
    URL.revokeObjectURL(currentFileURL);
  }
  currentFileURL = URL.createObjectURL(audio);

  
  const songText = document.querySelector('.song-upload p');
  songText.innerHTML = `<i class="me-3 bi bi-file-earmark-play-fill"></i> ${audio.name} - ${(audio.size / (1024 * 1024)).toFixed(2)} MB / 50MB<br>Click here to change your song. (File should not exceed 50MB. MP3, WAV, OGG, FLAC, M4A are supported.)`;
  songText.innerHTML += `<br><audio controls class="mt-3">
  <source src="${currentFileURL}" type="${audio.type}">
  Your browser does not support the audio element.
  </audio>`;

}
const tags = document.querySelector(".tagsInput");
const tagsCheck = document.querySelector("#tagsInputCheck");

tags.addEventListener("input", function() {
  const tagsContent = tags.value.trim();
  const tagsWords = tagsContent === '' ? 0 : tagsContent.split(/\s+/).length;
  const maxWords = 50;
  tagsCheck.innerHTML = (tagsContent).length > 0
    ? `Current tags: ${(tagsContent).split(/\s+/).join(', ')}`
    : "There are currently no tags. Choose words that best describe your track!";
});