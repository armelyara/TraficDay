$(document).ready(function() {
    // Your web app's Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyDZlmVA3iWRvFMAEHvv-8UfSU6qB7ymVZY",
        authDomain: "traffic-day.firebaseapp.com",
        databaseURL: "https://traffic-day.firebaseio.com",
        projectId: "traffic-day",
        storageBucket: "traffic-day.appspot.com",
        messagingSenderId: "926780628216",
        appId: "1:926780628216:web:1c1896bd89f40f75462f0d",
        measurementId: "G-M935ZZJFT9"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.analytics();




    //create firebase references
    var Auth = firebase.auth();
    var dbRef = firebase.database();
    var contactsRef = dbRef.ref('contacts')
    var usersRef = dbRef.ref('users')
    var auth = null;
    var guestbookListener = null;

    //MsgElem = document.getElementById("msg");
    //TokenElem = document.getElementById("token");
    //NotisElem = document.getElementById("notis");
    //ErrElem = document.getElementById("err");



    //Register
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();
        $('#registerModal').modal('hide');
        $('#messageModalLabel').html(spanText('<i class="fa fa-cog fa-spin"></i>', ['center', 'info']));
        $('#messageModal').modal('show');
        var data = {
            email: $('#registerEmail').val(), //get the email from Form
            firstName: $('#registerFirstName').val(), // get firstName
            lastName: $('#registerLastName').val(), // get lastName
        };
        var passwords = {
            password: $('#registerPassword').val(), //get the pass from Form
            cPassword: $('#registerConfirmPassword').val(), //get the confirmPass from Form
        }
        if (data.email != '' && passwords.password != '' && passwords.cPassword != '') {
            if (passwords.password == passwords.cPassword) {
                //create the user

                firebase.auth()
                    .createUserWithEmailAndPassword(data.email, passwords.password)
                    .then(function(user) {
                        return user.updateProfile({
                            displayName: data.firstName + ' ' + data.lastName
                        })
                    })
                    .then(function(user) {
                        //now user is needed to be logged in to save data
                        auth = user;
                        //now saving the profile data
                        usersRef.child(user.uid).set(data)
                            .then(function() {
                                console.log("User Information Saved:", user.uid);
                            })
                        $('#messageModalLabel').html(spanText('Success!', ['center', 'success']))

                        $('#messageModal').modal('hide');
                    })
                    .catch(function(error) {
                        console.log("Error creating user:", error);
                        $('#messageModalLabel').html(spanText('ERROR: ' + error.code, ['danger']))
                    });
            } else {
                //password and confirm password didn't match
                $('#messageModalLabel').html(spanText("ERROR: Passwords didn't match", ['danger']))
            }
        }
    });

    //Login
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        $('#loginModal').modal('hide');
        $('#messageModalLabel').html(spanText('<i class="fa fa-cog fa-spin"></i>', ['center', 'info']));
        $('#messageModal').modal('show');

        if ($('#loginEmail').val() != '' && $('#loginPassword').val() != '') {
            //login the user
            var data = {
                email: $('#loginEmail').val(),
                password: $('#loginPassword').val()
            };
            firebase.auth().signInWithEmailAndPassword(data.email, data.password)
                .then(function(authData) {
                    auth = authData;
                    $('#messageModalLabel').html(spanText('Success!', ['center', 'success']))
                    $('#messageModal').modal('hide');
                })
                .catch(function(error) {
                    console.log("Login Failed!", error);
                    $('#messageModalLabel').html(spanText('ERROR: ' + error.code, ['danger']))
                });
        }
    });

    $('#logout').on('click', function(e) {
        e.preventDefault();
        firebase.auth().signOut()
    });

    //save contact
    $('#contactForm').on('submit', function(event) {
        event.preventDefault();
        if (auth != null) {
            if ($('#name').val() != '' || $('#email').val() != '') {
                contactsRef.child(auth.uid)
                    .push({
                        name: $('#name').val(),
                        email: $('#email').val(),
                        location: {
                            city: $('#city').val(),
                            state: $('#state').val(),
                            zip: $('#zip').val()
                        }
                    })
                document.contactForm.reset();
            } else {
                alert('Please fill at-lease name or email!');
            }
        } else {
            //inform user to login
        }
    });

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            auth = user;
            $('body').removeClass('auth-false').addClass('auth-true');
            usersRef.child(user.uid).once('value').then(function(data) {
                var info = data.val();
                if (user.photoUrl) {
                    $('.user-info img').show();
                    $('.user-info img').attr('src', user.photoUrl);
                    $('.user-info .user-name').hide();
                } else if (user.displayName) {
                    $('.user-info img').hide();
                    $('.user-info').append('<span class="user-name">' + user.displayName + '</span>');
                } else if (info.firstName) {
                    $('.user-info img').hide();
                    $('.user-info').append('<span class="user-name">' + info.firstName + '</span>');
                }
            });
            contactsRef.child(user.uid).on('child_added', onChildAdd);
        } else {
            // No user is signed in.
            $('body').removeClass('auth-true').addClass('auth-false');
            auth && contactsRef.child(auth.uid).off('child_added', onChildAdd);
            $('#contacts').html('');
            auth = null;
        }
    });
});

function onChildAdd(snap) {
    $('#contacts').append(contactHtmlFromObject(snap.key, snap.val()));
}

//prepare contact object's HTML
function contactHtmlFromObject(key, contact) {
    return '<div class="card contact" style="width: 18rem;" id="' + key + '">' +
        '<div class="card-body">' +
        '<h5 class="card-title">' + contact.name + '</h5>' +
        '<h6 class="card-subtitle mb-2 text-muted">' + contact.email + '</h6>' +
        '<p class="card-text" title="' + contact.location.zip + '">' +
        contact.location.city + ', ' +
        contact.location.state +
        '</p>'
        // + '<a href="#" class="card-link">Card link</a>'
        // + '<a href="#" class="card-link">Another link</a>'
        +
        '</div>' +
        '</div>';
}

//Listen to the form submission
// xxxxxxxxxx Save profile and update database xxxxxxxxxx
function saveProfile() {
    //let userFullName = document.getElementById("userFullName").value 
    //let userSurname = document.getElementById("userSurname").value 
    //let userFacebook = document.getElementById("userFacebook").value 
    //let userTwitter = document.getElementById("userTwitter").value 
    //let userGooglePlus = document.getElementById("userGooglePlus").value 
    let message = document.getElementById("message").value
        //var userFullNameFormate = /^([A-Za-z.\s_-])/; 
        //var checkUserFullNameValid = userFullName.match(userFullNameFormate);
        //if(checkUserFullNameValid == null){
        //  return checkUserFullName();
        //}else if(userSurname === ""){
        //  return checkUserSurname();
        //}else{
        //  let user = firebase.auth().currentUser;
        //let uid;
        //if(user != null){
        //  uid = user.uid;
        //}
    var firebaseRef = firebase.database().ref();
    var userData = {
        //   userFullName: userFullName,
        // userSurname: userSurname,
        //userFb: userFacebook,
        //userTw: userTwitter,
        //userGp: userGooglePlus,
        message: message,
    }
    firebaseRef.child(uid).set(userData);
    swal({
        type: 'successfull',
        title: 'Update successfull',
        text: 'Profile updated.',
    }).then((value) => {
        setTimeout(function() {
            document.getElementById("profileSection").style.display = "block";

            document.getElementById("editProfileForm").style.display = "none";
        }, 1000)
    });
}


if ('serviceWorker' in navigator && 'PushManager' in window) {
    console.log('Service Worker and Push is supported');

    navigator.serviceWorker.register('sw.js')
        .then(function(swReg) {
            console.log('Service Worker is registered', swReg);

            swRegistration = swReg;
            initializeUI();
        })
        .catch(function(error) {
            console.error('Service Worker Error', error);
        });
} else {
    console.warn('Push messaging is not supported');
    pushButton.textContent = 'Push Not Supported';
}