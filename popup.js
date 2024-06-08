import { getActiveTab } from "./utils.js";
let allHighlights;
let colors = [];
const addNewAnnotation = (viewAnnotations, singleAnnotaion) => {
    const highlightDiv = document.createElement("div");
    const highlightTextDiv = document.createElement("div");
    highlightTextDiv.innerText = singleAnnotaion.text;
    highlightDiv.appendChild(highlightTextDiv);
    const highlightNotesDiv = document.createElement("div");
    highlightNotesDiv.style.display = "none";
    highlightTextDiv.addEventListener("click", () => {
        highlightNotesDiv.classList.toggle("active")
    })
    singleAnnotaion.notes && singleAnnotaion.notes.forEach((note) => {
        const singleNoteDiv = document.createElement("p");
        singleNoteDiv.innerText = note;
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
        showAnnotations(filteredHighlights);
    }
})

const exportWebpageContent = async (tab) => {
    chrome.tabs.sendMessage(tab.id, {
        action: "download",
    })
}

const downloadBtn = document.getElementById("downloadBtn");
downloadBtn.addEventListener("click", async () => {
    const activeTab = await getActiveTab();
    chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        function: exportWebpageContent(activeTab)
    });
})

const searchBtn = document.getElementById("searchBtn");
searchBtn.addEventListener("click", () => {
    const searchAnnotation = document.getElementById("searchAnnotation");
    const searchAnnotationByDate = document.getElementById("searchAnnotationByDate")
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
                    const colorToDelete = crossBtn.parentNode.getAttribute("data-color");
                    colors = colors.filter(i => i !== colorToDelete);
                    chrome.storage.sync.set({
                        "colors": colors
                    });
                    showColorsOnPopup();
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
    })

}
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

});

