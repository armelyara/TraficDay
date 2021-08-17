  //Reference message
  var db = firebase.firestore();
  
//Reference à firebase Storage

var storage = firebase.storage();

// Récupération de la photo

function uploadImage() {
  const ref = firebase.storage().ref();
  const file = document.querySelector("#photo").files[0];
  const name = +new Date() + "-" + file.name;
  const metadata = {
    contentType: file.type,
  };
  const task = ref.child(name).put(file, metadata);
  task.then((snapshot) => snapshot.ref.getDownloadURL()).catch(console.error);
  alert("Image envoyé");
}
  
//creation du document pour afficher le fireStore par date

var dateActu;

setInterval(function () {
  dateActu = Date();
  // return dateActu;
}, 1000);

  //Ecoute du premier formulaire1
  
  document.getElementById("form1").addEventListener("submit", FormulaireAlerte);
  
  //Ecoute du premier formulaire2
  
  document
    .getElementById("contact")
    .addEventListener("submit", FormulaireSignalez);
  
  // premier formulaire
  function FormulaireAlerte(e) {
    e.preventDefault();
    //get input values
    var nom = getInputVal("firstName");
    var numero = getInputVal("phoneNum");
    var lieuPertubation = getInputVal("lieuPerturb");
    var typeAlerte = getInputVal("catId");
    var TempsDeSignalement = firebase.firestore.FieldValue.serverTimestamp();
  
    sauvegardeMessageFormulaireAlerte(nom, numero, lieuPertubation, typeAlerte, TempsDeSignalement);
    //   console.log(nom, numero, lieuPertubation, typeAlerte);
  }

  // deuxieme formulaire
  
  function FormulaireSignalez(e) {
    e.preventDefault();
    //pour prendre les valeurs du formulaires 2
    var NumeroVéhicule = getInputVal("plateNum");
    var NumeroTelephone = getInputVal("numPhone");
    var ZoneCirculation = getInputVal("alertesss");
    var Signalement = getInputVal("signId");
    var TempsDeSignalement = firebase.firestore.FieldValue.serverTimestamp();

  
    //   console.log(NumeroVéhicule, NumeroTelephone, ZoneCirculation, Signalement);
  
    sauvegardeMessageFormulaireSignalement(
      NumeroVéhicule,
      NumeroTelephone,
      ZoneCirculation,
      Signalement,
      TempsDeSignalement
    );
  }
  
  
  //pour recupérer les valeurs des inputs
  function getInputVal(id) {
    return document.getElementById(id).value;
  }
  
  //fonction pour sauvegarder les messages du formulaire pour les alertes
  
  function sauvegardeMessageFormulaireAlerte(
    nom,
    numero,
    lieuPerturb,
    typeAlerte,
    TempsDeSignalement
  ) {
    var newDb = db.collection("alertes").doc(dateActu);
    newDb.set({
      nom: nom,
      numero: numero,
      lieuPertubation: lieuPerturb,
      typeAlerte: typeAlerte,
      TempsDeSignalement: TempsDeSignalement
    });
    alert("Message bien reçu");
  }
  
  //fonction pour sauvegarder les messages du formulaire pour les signalements
  
  function sauvegardeMessageFormulaireSignalement(
    NumeroVéhicule,
    NumeroTelephone,
    ZoneCirculation,
    Signalement,
    TempsDeSignalement
  ) {
    var newDb = db.collection("signalements").doc(dateActu);
    newDb.set({
      NumeroVéhicule: NumeroVéhicule,
      NumeroTelephone: NumeroTelephone,
      ZoneCirculation: ZoneCirculation,
      Signalement: Signalement,
      TempsDeSignalement: TempsDeSignalement
    });
    alert("Message bien reçu");
  }
  