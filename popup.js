import { getActiveTab } from "./utils.js";
let allHighlights;
let colors = [];
const addNewAnnotation = (viewAnnotations, singleAnnotaion) => {

    const highlightDiv = document.createElement("div");
    highlightDiv.className = "highlightDiv";
    const highlightTextDiv = document.createElement("div");
    highlightTextDiv.className = "highlightTextDiv";
    highlightTextDiv.innerText = singleAnnotaion.text;

    const deleteHighlightBtn = document.createElement("button");
    deleteHighlightBtn.style.width = "20px";
    deleteHighlightBtn.className = "deleteHighlightBtn";
    deleteHighlightBtn.style.height = "inherit";
    deleteHighlightBtn.style.backgroundColor = "red";
    deleteHighlightBtn.textContent = "X";
    highlightTextDiv.addEventListener("mouseover", () => {
        deleteHighlightBtn.classList.add("active");
    })
    highlightTextDiv.addEventListener("mouseout", () => {
        deleteHighlightBtn.classList.remove("active");
    })
    deleteHighlightBtn.addEventListener("click", async () => {
        allHighlights = allHighlights.filter((i) => JSON.stringify(i) !== JSON.stringify(singleAnnotaion));
        let currentPage = await getActiveTab();
        chrome.storage.sync.set({
            [currentPage.url]: JSON.stringify(allHighlights)
        })
        chrome.tabs.sendMessage(currentPage.id, {
            action: "DELETE",
            highlight: singleAnnotaion
        })
        showAnnotations(allHighlights);
    })
    highlightTextDiv.appendChild(deleteHighlightBtn);



    highlightDiv.appendChild(highlightTextDiv);
    const highlightNotesDiv = document.createElement("div");
    highlightNotesDiv.className = "highlightNotesDiv";
    highlightNotesDiv.style.display = "none";
    highlightTextDiv.addEventListener("click", async () => {
        highlightNotesDiv.classList.toggle("active");
        const activeTab = await getActiveTab();
        chrome.tabs.sendMessage(activeTab.id, {
            action: "getElementByXPath",
            xPath: singleAnnotaion.startXPath
        })

    })
    if (singleAnnotaion.notes && singleAnnotaion.notes.length > 0) {
        const span = document.createElement("span");
        span.textContent = "Notes";
        highlightNotesDiv.appendChild(span);
    }
    singleAnnotaion.notes && singleAnnotaion.notes.forEach((note) => {
        const singleNoteDiv = document.createElement("p");
        singleNoteDiv.innerText = note[0];
        highlightNotesDiv.appendChild(singleNoteDiv);
    })
    highlightDiv.appendChild(highlightNotesDiv);
    viewAnnotations.appendChild(highlightDiv);
}

const showAnnotations = (allHighlights = []) => {
    const viewAnnotations = document.getElementById("viewAnnotations");
    viewAnnotations.innerHTML = "";
    if (allHighlights.length > 0) {
        for (let i = 0; i < allHighlights.length; i++) {
            const singleAnnotaion = allHighlights[i];
            addNewAnnotation(viewAnnotations, singleAnnotaion);
        }
    }
    else {
        const div = document.createElement("div");
        div.innerText = "No Highlights Found";
        div.className = "highlightTextDiv";
        div.style.marginTop = "10px";
        viewAnnotations.appendChild(div);
    }
}
const saveColorBtn = document.getElementById("saveColorBtn");
saveColorBtn.addEventListener("click", () => {
    const colorInput = document.getElementById("favColor").value;
    if (!colors.includes(colorInput)) {
        colors.push(colorInput);
        chrome.storage.sync.set({
            "colors": colors
        });
        showColorsOnPopup();
    }
    else {
        alert("Color already present");
    }
})




const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", () => {
    const keyword = searchInput.value.trim();
    if (keyword) {
        const filteredHighlights = allHighlights.filter(highlight => highlight.text.toLowerCase().includes(keyword.toLowerCase()));
        const viewAnnotations = document.getElementById("viewAnnotations");
        if (!viewAnnotations.classList.contains("active")) {
            viewAnnotations.classList.add("active");
        }
        showAnnotations(filteredHighlights);
    }
});

const submitDateFilter = document.getElementById("submitDateFilter");
submitDateFilter.addEventListener("click", () => {
    const fromDate = document.getElementById("dateInputFrom").value;
    const toDate = document.getElementById("dateInputTo").value;
    if (fromDate && toDate) {
        const formattedFromDate = new Date(fromDate);
        const formattedToDate = new Date(toDate);
        const filteredHighlights = allHighlights.filter(highlight => {
            console.log(highlight);
            const noteDate = new Date(new Date(highlight.date).toISOString().split('T')[0]);
            return noteDate.getTime() >= formattedFromDate.getTime() && noteDate.getTime() <= formattedToDate.getTime();
        });
        const viewAnnotations = document.getElementById("viewAnnotations");
        if (!viewAnnotations.classList.contains("active")) {
            viewAnnotations.classList.add("active");
        }
        showAnnotations(filteredHighlights);
    }
})


const downloadBtn = document.getElementById("downloadBtn");
downloadBtn.addEventListener("click", async () => {
    const alertUser = document.getElementById("alertUser");
    alertUser.style.display = "block";
    setTimeout(() => {
        alertUser.style.display = "none";
    }, 2000);
    const loader = document.getElementById("loader");
    const downloadBtn = document.getElementById("downloadBtn");
    const btnText = document.getElementById("btnText");
    loader.style.display = "inline";
    btnText.style.display = "none";
    const activeTab = await getActiveTab();
    chrome.tabs.sendMessage(activeTab.id, {
        action: "download",
    }, (res) => {
        if (res.status == "completed") {
            loader.style.display = "none";
            btnText.style.display = "inline";
        }
    })

})

const searchBtn = document.getElementById("searchBtn");
searchBtn.addEventListener("click", () => {
    const searchAnnotation = document.getElementById("searchAnnotation");
    const searchAnnotationByDate = document.getElementById("searchAnnotationByDate")
    document.getElementById("dateInputFrom").value = "";
    document.getElementById("dateInputTo").value = "";
    searchAnnotation.classList.toggle("active");
    searchAnnotationByDate.classList.toggle("active");
})

const showColorsOnPopup = async () => {
    chrome.storage.sync.get("colors", async (res) => {
        if (res["colors"]) {
            colors = res["colors"];
            const colorPicker = document.getElementById("colorPicker");
            const activeTab = await getActiveTab();
            colorPicker.innerHTML = "";
            colors.forEach((color) => {
                const colorOption = document.createElement("div");
                colorOption.className = "colorOption";
                colorOption.setAttribute("data-color", color);
                colorOption.style.backgroundColor = color;
                const crossBtn = document.createElement("div");
                crossBtn.className = "crossBtn";
                crossBtn.innerText = "X";
                colorOption.addEventListener("mouseover", () => {
                    crossBtn.style.display = "flex";
                })
                colorOption.addEventListener("mouseleave", () => {
                    crossBtn.style.display = "none";
                })
                crossBtn.addEventListener("click", () => {
                    if (colors.length >= 2) {
                        const colorToDelete = crossBtn.parentNode.getAttribute("data-color");
                        colors = colors.filter(i => i !== colorToDelete);
                        chrome.storage.sync.set({
                            "colors": colors
                        });
                        showColorsOnPopup();
                    }
                    else {
                        alert("Atleast one color should be there!");
                    }
                })
                crossBtn.addEventListener("mouseover", () => {
                    crossBtn.style.scale = "1.2";
                })
                crossBtn.addEventListener("mouseleave", () => {
                    crossBtn.style.scale = "1";
                })
                colorOption.appendChild(crossBtn);

                colorOption.addEventListener("click", () => {
                    chrome.tabs.sendMessage(activeTab.id, {
                        action: "setColor",
                        color: color
                    });

                    document.querySelectorAll(".colorOption").forEach((option) => {
                        option.style.border = "none";
                    })
                    colorOption.style.border = "2px solid black";
                });
                colorPicker.appendChild(colorOption);
            })
        }
        const firstColor = document.querySelectorAll(".colorOption")[0];
        firstColor.click();
    })

}
const viewShortcuts = document.getElementById("viewShortcuts");
viewShortcuts.addEventListener("click", () => {
    const shortcutsDiv = document.getElementById("shortcutsDiv");
    shortcutsDiv.classList.toggle("active");
})
document.addEventListener("DOMContentLoaded", async () => {
    showColorsOnPopup();

    const activeTab = await getActiveTab();
    const fontSelect = document.getElementById("fontSelect");
    fontSelect.addEventListener("change", () => {
        const selectedFont = fontSelect.value;
        chrome.tabs.sendMessage(activeTab.id, {
            action: "setFont",
            font: selectedFont
        })
    });

    chrome.storage.sync.get([activeTab.url], (res) => {
        allHighlights = res[activeTab.url] ? JSON.parse(res[activeTab.url]) : []
        showAnnotations(allHighlights);
    })
    const viewNoteBtn = document.getElementById('viewNoteBtn');
    viewNoteBtn.addEventListener("click", () => {
        const viewAnnotations = document.getElementById("viewAnnotations");
        showAnnotations(allHighlights);
        viewAnnotations.classList.toggle("active");
    })

});

