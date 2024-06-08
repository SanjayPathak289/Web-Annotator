let currentColor = "";
let currentFont = "";
let currentWebPage = "";
let allHighlights = [];
let contextualBox;

const injectSelectionStyles = () => {
    style = document.createElement('style');
    document.head.appendChild(style);
    style.textContent += `
        ::selection {
            background-color: ${currentColor};
        }`;
}

const fetchHighlights = () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get([currentWebPage], (res) => {
            resolve(res[currentWebPage] ? JSON.parse(res[currentWebPage]) : [])
        })
    })
}
const addHighlight = async (info) => {
    allHighlights = await fetchHighlights();
    allHighlights.push(info);
    chrome.storage.sync.set({
        [currentWebPage]: JSON.stringify(allHighlights)
    })
}
function getXPathForElement(element) {
    var xpath = '';
    for (; element && element.nodeType == 1; element = element.parentNode) {
        var id = Array.from(element.parentNode.children).indexOf(element) + 1;
        xpath = '/*[position()=' + id + ']' + xpath;
    }
    return xpath;
}
function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}



const showNotes = () => {

}
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            document.execCommand("fontName", false, currentFont);
        }
    }
});
let i = 0;
document.addEventListener("keydown", (event) => {
    if (event.key === 'b') {
        const nextElement = allHighlights[i++];
        const ele = getElementByXPath(nextElement.startXPath);
        ele.scrollIntoView({
            behaviour: "smooth",
            block: "center",
            inline: "center"
        });
        ele.style.backgroundColor = "rgba(0,0,0,0.4)";
        ele.style.transition = "all 0.3s linear";
        setTimeout(() => {
            ele.style.backgroundColor = "transparent";
        }, 700);
        if (i >= allHighlights.length) {
            i = 0;
        }
    }
})

document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            const span = document.createElement('span');
            span.className = `highlight-${currentColor}`;
            span.style.position = "relative";
            span.style.fontFamily = currentFont;
            range.surroundContents(span);

            let startContainer = range.startContainer;
            var startXPath = getXPathForElement(startContainer.nodeType === 1 ? startContainer : startContainer.parentNode);
            var storedRange = {
                text: range.toString(),
                color: currentColor,
                startXPath: startXPath,
                rect: range.getBoundingClientRect(),
                font: currentFont,
                date: new Date()
            };
            addHighlight(storedRange);
            selection.removeAllRanges();
            let rect = range.getBoundingClientRect();
            span.addEventListener("mouseover", async (event) => {
                if (!contextualBox.contains(event.relatedTarget)) {
                    allHighlights = await fetchHighlights();
                    const obj = allHighlights.find(item => JSON.stringify(item.rect) === JSON.stringify(rect));
                    if (obj) {
                        if (Array.isArray(obj.notes)) {
                            showContextualBox(span, rect, obj.notes);
                        }
                        else {
                            showContextualBox(span, rect);
                        }
                    }
                }
            });
            span.addEventListener("mouseout", (event) => {
                if (!contextualBox.contains(event.relatedTarget) && !span.contains(event.relatedTarget)) {
                    const saveBtn = document.getElementById("saveBtn");
                    if (saveBtn) {
                        saveBtn.parentNode.removeChild(saveBtn);
                    }

                    const notesDiv = document.getElementById("notesDiv");
                    const noteBtn = document.querySelectorAll(".noteBtn");
                    noteBtn.forEach((i) => i.parentNode.removeChild(i));
                    if (notesDiv) {
                        notesDiv.parentNode.removeChild(notesDiv);
                    }
                    const noNotesDiv = document.getElementById("noNotesDiv");
                    if (noNotesDiv) {
                        noNotesDiv.parentElement.removeChild(noNotesDiv);
                    }

                    const udDiv = document.getElementById("udDiv");
                    if (udDiv) {
                        udDiv.parentNode.removeChild(udDiv);
                    }
                    contextualBox.style.display = "none";
                }
            })
            contextualBox.addEventListener("mouseover", () => {
                contextualBox.style.display = "block";
            });
            contextualBox.addEventListener("mouseout", (event) => {
                if (!contextualBox.contains(event.relatedTarget) && !span.contains(event.relatedTarget)) {

                    const saveBtn = document.getElementById("saveBtn");
                    if (saveBtn) {
                        saveBtn.parentNode.removeChild(saveBtn);
                    }
                    const noteBtn = document.querySelectorAll(".noteBtn");
                    noteBtn.forEach((i) => i.parentNode.removeChild(i));
                    const notesDiv = document.getElementById("notesDiv");
                    if (notesDiv) {
                        notesDiv.parentNode.removeChild(notesDiv);
                    }
                    const noNotesDiv = document.getElementById("noNotesDiv");
                    if (noNotesDiv) {
                        noNotesDiv.parentElement.removeChild(noNotesDiv);
                    }
                    const udDiv = document.getElementById("udDiv");
                    if (udDiv) {
                        udDiv.parentNode.removeChild(udDiv);
                    }
                    contextualBox.style.display = "none";
                }
            });


        }
    }
});

const makeContextualBox = () => {
    contextualBox = document.createElement("div");
    contextualBox.id = "hover-box";

    const tabDiv = document.createElement("div");
    tabDiv.id = "tabDiv";
    const addNoteBtn = document.createElement("button");
    addNoteBtn.id = "addNoteBtn";
    addNoteBtn.textContent = "+";
    tabDiv.id = "tabDiv";
    tabDiv.appendChild(addNoteBtn);
    contextualBox.appendChild(tabDiv);

}
makeContextualBox();
const saveHandler = (rect) => {
    const notesDiv = document.getElementById("notesDiv");
    const noteValue = notesDiv.value;
    const obj = allHighlights.find(item => JSON.stringify(item["rect"]) === JSON.stringify(rect));
    if (obj) {
        if (!Array.isArray(obj.notes)) {
            obj.notes = [];
        }
        obj.notes.push([noteValue, new Date()]);
        notesDiv.innerText = "";
        chrome.storage.sync.set({
            [currentWebPage]: JSON.stringify(allHighlights)
        })
        let saveBtn = document.getElementById("saveBtn");

        if (saveBtn) {
            saveBtn.textContent = "Saved!";
            setTimeout(() => {
                saveBtn.parentNode.removeChild(saveBtn);
            }, 200);
        }
        console.log("saved");
    }
    else {
        console.log("No object found");
    }
}
const showContextualBox = (span, rect, notes = []) => {
    // if (contextualBox.style.display == "none") {
    let div = document.getElementById("hover-box");
    if (div) {
        div.parentNode.removeChild(div);
    }

    contextualBox.style.left = `${Math.abs(150 - rect.width / 2)}px`;
    contextualBox.style.bottom = `${rect.height}px`;

    contextualBox.style.display = "block";
    span.appendChild(contextualBox);
    const tabDiv = document.getElementById("tabDiv");
    tabDiv.innerHTML = "";
    const addNoteBtn = document.createElement("button");
    addNoteBtn.id = "addNoteBtn";
    addNoteBtn.textContent = "+";
    addNoteBtn.addEventListener("click", () => {
        const noNotesDiv = document.getElementById("noNotesDiv");
        if (noNotesDiv) {
            noNotesDiv.parentElement.removeChild(noNotesDiv);
        }
        const udDiv = document.getElementById("udDiv");
        if (udDiv) {
            udDiv.parentNode.removeChild(udDiv);
        }
        const note1 = document.createElement("button");
        note1.className = "noteBtn";
        if (notes) {
            note1.textContent = `note#${notes.length + 1}`;
            note1.id = `note#${notes.length + 1}`;
        }
        else {
            note1.textContent = `note#1`;
            note1.id = `note#1`;
        }
        tabDiv.appendChild(note1);
        let notesDiv = document.getElementById("notesDiv");
        if (!notesDiv) {
            notesDiv = document.createElement("textarea");
            notesDiv.id = "notesDiv";
            contextualBox.appendChild(notesDiv);
        }
        notesDiv.innerText = "";
        let saveBtn = document.getElementById("saveBtn");

        if (!saveBtn) {
            saveBtn = document.createElement("button");
            saveBtn.id = "saveBtn";
            saveBtn.className = "btn";
            saveBtn.textContent = "Save";
            contextualBox.appendChild(saveBtn);
            saveBtn.addEventListener("click", () => { saveHandler(rect) });
        }

    })
    tabDiv.appendChild(addNoteBtn);
    if (notes && notes.length > 0) {
        notes.forEach((note, i) => {
            const noteBtn = document.createElement("button");
            noteBtn.id = `note#${i + 1}`;
            noteBtn.textContent = `note#${i + 1}`;
            noteBtn.style.cursor = "pointer";
            noteBtn.className = "noteBtn";
            tabDiv.append(noteBtn);
            noteBtn.addEventListener("click", () => {
                const saveBtn = document.getElementById("saveBtn");
                if (saveBtn) {
                    saveBtn.parentNode.removeChild(saveBtn);
                }
                let notesDiv = document.getElementById("notesDiv");
                if (!notesDiv) {
                    notesDiv = document.createElement("textarea");
                    notesDiv.id = "notesDiv";
                    contextualBox.appendChild(notesDiv);
                }
                notesDiv.innerText = note[0];
                let udDiv = document.getElementById("udDiv");
                if (udDiv) {
                    udDiv.parentNode.removeChild(udDiv);
                }
                udDiv = document.createElement("div");
                udDiv.id = "udDiv";

                const updateBtn = document.createElement("button");
                const deleteBtn = document.createElement("button");
                updateBtn.id = `update${i + 1}`;
                updateBtn.className = "udBtn";
                updateBtn.textContent = "Update"
                updateBtn.style.backgroundColor = "#14A44D";
                deleteBtn.id = `delete${i + 1}`;
                deleteBtn.className = "udBtn";



                deleteBtn.textContent = "Delete"
                deleteBtn.style.backgroundColor = "#DC4C64";


                updateBtn.addEventListener("click", () => {
                    const notesDiv = document.getElementById("notesDiv");
                    notes[i] = [notesDiv.value, new Date()];
                    let index = allHighlights.findIndex(ele => JSON.stringify(ele["rect"]) === JSON.stringify(rect));
                    allHighlights[index].notes = notes;
                    chrome.storage.sync.set({
                        [currentWebPage]: JSON.stringify(allHighlights)
                    });
                    showContextualBox(span, rect, notes);

                })
                deleteBtn.addEventListener("click", () => {
                    notes.splice(i, 1);
                    let index = allHighlights.findIndex(ele => JSON.stringify(ele["rect"]) === JSON.stringify(rect));
                    allHighlights[index].notes = notes;
                    chrome.storage.sync.set({
                        [currentWebPage]: JSON.stringify(allHighlights)
                    });
                    let notesDiv = document.getElementById("notesDiv");
                    if (notesDiv) {
                        notesDiv.parentNode.removeChild(notesDiv);
                    }
                    let udDiv = document.getElementById("udDiv");
                    if (udDiv) {
                        udDiv.parentNode.removeChild(udDiv);
                    }
                    showContextualBox(span, rect, notes);
                })
                udDiv.appendChild(updateBtn);
                udDiv.appendChild(deleteBtn);
                contextualBox.appendChild(udDiv);
            });


        });
    }
    else {
        let noNotesDiv = document.getElementById("noNotesDiv");
        if (!noNotesDiv) {
            noNotesDiv = document.createElement("div");
            noNotesDiv.id = "noNotesDiv";
            noNotesDiv.innerHTML = "No Notes To Show";
            contextualBox.appendChild(noNotesDiv);
        }
    }

    // }
}
function wrapTextInSpan(startNode, textToWrap, color, rect, notes) {
    let currentNode = startNode;

    // Function to recursively search and replace the text within the node and its children
    function recursiveWrap(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            let index = text.indexOf(textToWrap);
            if (index !== -1) {
                // Split the text node at the start and end of the text to wrap
                let beforeText = text.slice(0, index);
                let afterText = text.slice(index + textToWrap.length);

                // Create a new span element
                let span = document.createElement('span');
                span.className = `highlight-${color}`;
                span.textContent = textToWrap;
                span.style.position = "relative";

                span.addEventListener("mouseover", async (event) => {
                    if (!contextualBox.contains(event.relatedTarget)) {
                        allHighlights = await fetchHighlights();
                        const obj = allHighlights.find(item => JSON.stringify(item.rect) === JSON.stringify(rect));
                        if (obj) {
                            if (Array.isArray(obj.notes)) {
                                showContextualBox(span, rect, obj.notes);
                            }
                            else {
                                showContextualBox(span, rect, notes);
                            }
                        }
                    }
                });
                span.addEventListener("mouseout", (event) => {
                    if (!contextualBox.contains(event.relatedTarget) && !span.contains(event.relatedTarget)) {
                        const saveBtn = document.getElementById("saveBtn");
                        if (saveBtn) {
                            saveBtn.parentNode.removeChild(saveBtn);
                        }

                        const notesDiv = document.getElementById("notesDiv");
                        const noteBtn = document.querySelectorAll(".noteBtn");
                        noteBtn.forEach((i) => i.parentNode.removeChild(i));
                        if (notesDiv) {
                            notesDiv.parentNode.removeChild(notesDiv);
                        }
                        const noNotesDiv = document.getElementById("noNotesDiv");
                        if (noNotesDiv) {
                            noNotesDiv.parentElement.removeChild(noNotesDiv);
                        }

                        const udDiv = document.getElementById("udDiv");
                        if (udDiv) {
                            udDiv.parentNode.removeChild(udDiv);
                        }
                        contextualBox.style.display = "none";
                    }
                })
                contextualBox.addEventListener("mouseover", () => {
                    contextualBox.style.display = "block";
                });
                contextualBox.addEventListener("mouseout", (event) => {
                    if (!contextualBox.contains(event.relatedTarget) && !span.contains(event.relatedTarget)) {

                        const saveBtn = document.getElementById("saveBtn");
                        if (saveBtn) {
                            saveBtn.parentNode.removeChild(saveBtn);
                        }
                        const noteBtn = document.querySelectorAll(".noteBtn");
                        noteBtn.forEach((i) => i.parentNode.removeChild(i));
                        const notesDiv = document.getElementById("notesDiv");
                        if (notesDiv) {
                            notesDiv.parentNode.removeChild(notesDiv);
                        }
                        const noNotesDiv = document.getElementById("noNotesDiv");
                        if (noNotesDiv) {
                            noNotesDiv.parentElement.removeChild(noNotesDiv);
                        }
                        const udDiv = document.getElementById("udDiv");
                        if (udDiv) {
                            udDiv.parentNode.removeChild(udDiv);
                        }
                        contextualBox.style.display = "none";
                    }
                });

                // Create new text nodes for the before and after text
                let beforeNode = document.createTextNode(beforeText);
                let afterNode = document.createTextNode(afterText);

                // Replace the original text node with the new nodes
                let parent = node.parentNode;
                parent.insertBefore(beforeNode, node);
                parent.insertBefore(span, node);
                parent.insertBefore(afterNode, node);
                parent.removeChild(node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let child of Array.from(node.childNodes)) {
                recursiveWrap(child);
            }
        }
    }

    recursiveWrap(currentNode);
}


const showHighlights = async () => {
    allHighlights = await fetchHighlights();
    console.log(allHighlights);
    allHighlights.forEach(element => {
        setTimeout(() => {
            var startNode = getElementByXPath(element.startXPath);
            wrapTextInSpan(startNode, element.text, element.color, element.rect, element.notes);
        }, 2000);
    });


}

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(src);
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
};




chrome.runtime.onMessage.addListener((request, sender, response) => {
    if (request.action === "setColor") {
        currentColor = request.color;
        injectSelectionStyles();
    }
    else if (request.action == "setFont") {
        currentFont = request.font;
    }
    else if (request.action == "NEW") {
        currentWebPage = request.page;
        showHighlights();
    }
    
});
