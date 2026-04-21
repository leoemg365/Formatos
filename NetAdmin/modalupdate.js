const versionActual = "1.2"; // Cambia esto cada vez que actualices tu web
const modal = document.getElementById("modalActualizaciones");
const btnCerrar = document.getElementById("cerrarActualizacion");

window.addEventListener("load", () => {
    // Verificamos si el usuario ya vio esta versión específica
    const ultimaVersionVista = localStorage.getItem("versionVista");

    if (ultimaVersionVista !== versionActual) {
        modal.showModal(); // Método nativo para abrir dialog
    }
});

btnCerrar.onclick = () => {
    modal.close(); // Cierra el modal
    localStorage.setItem("versionVista", versionActual); // Guarda que ya se vio
};
