// toggle icon navbar
let menuIcon = document.querySelector('#menu-icon');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    menuIcon.classList.toggle('bx-x');
    navbar.classList.toggle('active');
}


// scroll sections
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {

    sections.forEach(sec => {
        let top = window.scrollY;
        let offset = sec.offsetTop - 100;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            // active navbar links
            navLinks.forEach(links => {
                links.classList.remove('active');
                document.querySelector('header nav a[href*=' + id + ']').classList.add('active');
            });
            // active  sections for animation on scroll
            sec.classList.add('show-animate');
        }
        // if want to use animation that reapeates on scroll use this

        else {
            sec.classList.remove('show-animate')
        }
    });


    // sticky header
    let header = document.querySelector('header');

    header.classList.toggle('sticky', window.scrollY > 100);


    // remove toggle icon and navbar when click navbar links (scroll)

    menuIcon.classList.remove('bx-x');
    navbar.classList.remove('active');

    // animation footer on scroll
    let footer = document.querySelector('footer');

    footer.classList.toggle('show-animate', this.innerHeight + this.scrollY >= document.scrollingElement.scrollHeight);

}

let popup = document.getElementById("popup");
function openPopup() {
    popup.classList.add("open-popup");
}
function closePopup() {
    popup.classList.remove("open-popup");
}



// custome popup
function openPopupinstagram() {
    document.getElementById("customPopup").classList.add("active");
}

function closePopupinstagram() {
    document.getElementById("customPopup").classList.remove("active");
}

window.onclick = function (e) {
    const popup = document.getElementById("customPopup");

    if (e.target === popup) {
        closePopupinstagram();
    }
}


const toggleBtn = document.getElementById("toggleSkills");
const moreSkills = document.getElementById("moreSkills");

toggleBtn.addEventListener("click", () => {

    moreSkills.classList.toggle("show");
    toggleBtn.classList.toggle("active");

    if(moreSkills.classList.contains("show")){
        toggleBtn.innerHTML =
            "<i class='bx bx-chevron-up'></i> Show Less";
    }else{
        toggleBtn.innerHTML =
            "<i class='bx bx-chevron-down'></i> See More Skills";
    }

});

// Skill popup

function openSkillsPopup() {
    document.getElementById("skillsPopup").classList.add("show");
}

function closeSkillsPopup() {
    document.getElementById("skillsPopup").classList.remove("show");
}

document.getElementById("skillsPopup").addEventListener("click", function (e) {
    if (e.target === this) {
        closeSkillsPopup();
    }
});

// Projects popup

    function openPopupProjects() {
        document.getElementById("customPopupProject").style.display = "flex";
    }

    function closePopupProjects() {
        document.getElementById("customPopupProject").style.display = "none";
    }

    // Close popup when clicking outside the popup box
    window.onclick = function (event) {
        const popup = document.getElementById("customPopupProject");
        if (event.target === popup) {
            closePopup();
        }
    };
