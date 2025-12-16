const modal = new bootstrap.Modal(document.querySelector('#alertModal'));
const modalBody = document.querySelector('#alertModal .modal-body');

function deleteSong(event, songId) {
    event.preventDefault();

    modal.show();
    modalBody.innerHTML = "Are you sure you want to delete this song? This action cannot be undone.<br><br>" +
        `<form action="/delete-song/${songId}" method="POST" style="display: inline;">` +
        `<button type="submit" onclick="disableButton(this)" class="btn btn-danger">Delete</button>` +
        `</form>` +
        ` <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>`;
}