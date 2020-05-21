const catId = document.getElementById('catId');
const firstName = document.getElementById('firstName');

const message = document.getElementById('message');
const addBtn = document.getElementById('addBtn');

const database = firebase.database();
const catRef = database.ref('/alerte');

addBtn.addEventListener('click', e => {
    e.preventDefault();
    const autoId = catRef.push().key
    catRef.child(autoId).set({
        first_name: firstName.value,
        phoneNum: phoneNum.value,
        catId: catId.value,
        message: message.value

    });
});
return