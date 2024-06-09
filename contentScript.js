let currentColor = "";
let currentFont = "";
let currentWebPage = "";
let allHighlights = [];
let contextualBox;
let unsavedNotes = [];

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



document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            document.execCommand("fontName", false, currentFont);
        }
    }
});
let iForScroll = 0;
let iForShow = 0;
document.addEventListener("keydown", (event) => {
    if (event.key === 'b') {
        const nextElement = allHighlights[iForScroll++];
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
        if (iForScroll >= allHighlights.length) {
            iForScroll = 0;
        }
    }
    else if (event.ctrlKey && event.key === 'q') {
        const element = allHighlights[iForShow++];
        if (element) {
            const span = getElementByXPath(element.startXPath).querySelector("span");
            if (Array.isArray(element.notes)) {
                span.scrollIntoView({
                    behaviour: "smooth",
                    block: "center",
                    inline: "center"
                })
                showContextualBox(span, element.rect, element.notes);
            }
            else {
                showContextualBox(span, element.rect);
            }
        }
        if (iForShow >= allHighlights.length) {
            iForShow = 0;
        }
    }

})

document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            const span = document.createElement('span');
            span.style.backgroundColor = currentColor;
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
                textColor: "",
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
                    const settingDiv = document.getElementById("settingDiv");
                    if (settingDiv) {
                        settingDiv.parentNode.removeChild(settingDiv);
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
                    const settingDiv = document.getElementById("settingDiv");
                    if (settingDiv) {
                        settingDiv.parentNode.removeChild(settingDiv);
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
    const settingBtn = document.createElement("btn");
    settingBtn.id = "settingBtn";
    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("assets/setting.png");
    settingBtn.appendChild(img);
    contextualBox.appendChild(settingBtn);
}
makeContextualBox();
const saveHandler = (rect, span, i) => {
    const notesDiv = document.getElementById("notesDiv");
    const noteValue = notesDiv.value;
    const obj = allHighlights.find(item => JSON.stringify(item["rect"]) === JSON.stringify(rect));
    if (obj) {
        if (!Array.isArray(obj.notes)) {
            obj.notes = [];
        }
        const noteArr = [noteValue, new Date()];
        obj.notes.push(noteArr);
        notesDiv.value = "";
        chrome.storage.sync.set({
            [currentWebPage]: JSON.stringify(allHighlights)
        })
        const note = document.getElementById(`note#${i}`);
        note.addEventListener("click", () => {
            noteBtnClickListenerHandler(span, obj.notes, noteArr, rect, i);
        });
        let saveBtn = document.getElementById("saveBtn");
        if (saveBtn) {
            saveBtn.textContent = "Saved!";
            setTimeout(() => {
                if (saveBtn) {
                    saveBtn.parentNode.removeChild(saveBtn);
                }
                note.click();
            }, 200);

        }
        console.log("saved");
    }
    else {
        console.log("No object found");
    }
}

const noteBtnClickListenerHandler = (span, notes, note, rect, i) => {
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
    const settingDiv = document.getElementById("settingDiv");
    if (settingDiv) {
        settingDiv.parentNode.removeChild(settingDiv);
    }
    notesDiv.value = note[0];
    let udDiv = document.getElementById("udDiv");
    if (udDiv) {
        udDiv.parentNode.removeChild(udDiv);
    }
    udDiv = document.createElement("div");
    udDiv.id = "udDiv";

    const updateBtn = document.createElement("button");
    const deleteBtn = document.createElement("button");
    updateBtn.id = `update${i}`;
    updateBtn.className = "udBtn";
    updateBtn.textContent = "Update"
    updateBtn.style.backgroundColor = "#14A44D";
    deleteBtn.id = `delete${i}`;
    deleteBtn.className = "udBtn";
    deleteBtn.textContent = "Delete"
    deleteBtn.style.backgroundColor = "#DC4C64";


    updateBtn.addEventListener("click", () => {
        const notesDiv = document.getElementById("notesDiv");
        notes[i - 1] = [notesDiv.value, new Date()];
        let index = allHighlights.findIndex(ele => JSON.stringify(ele["rect"]) === JSON.stringify(rect));
        allHighlights[index].notes = notes;
        chrome.storage.sync.set({
            [currentWebPage]: JSON.stringify(allHighlights)
        });
        updateBtn.textContent = "Updated!";
        setTimeout(() => {
            updateBtn.textContent = "Update"
        }, 500);

        showContextualBox(span, rect, notes);

    })
    deleteBtn.addEventListener("click", () => {
        notes.splice(i - 1, 1);
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
}

const tempClickListener = (notes, span, rect, noteBtn) => {
    if (noteBtn.getAttribute("saved") === "false") {
        let notesDiv = document.getElementById("notesDiv");
        if (!notesDiv) {
            notesDiv = document.createElement("textarea");
            notesDiv.id = "notesDiv";
            contextualBox.appendChild(notesDiv);
        }
        const settingDiv = document.getElementById("settingDiv");
        if (settingDiv) {
            settingDiv.parentNode.removeChild(settingDiv);
        }

        let noteBtnId = noteBtn.id;
        let unsavedIndex = unsavedNotes.findIndex(item => item.note === noteBtnId);
        if (unsavedNotes[unsavedIndex]) {
            notesDiv.value = unsavedNotes[unsavedIndex].text;
        }
        else {
            notesDiv.value = "";
        }
        const udDiv = document.getElementById("udDiv");
        if (udDiv) {
            udDiv.parentNode.removeChild(udDiv);
        }
        let saveBtn = document.getElementById("saveBtn");
        if (!saveBtn) {
            saveBtn = document.createElement("button");
            saveBtn.id = "saveBtn";
            saveBtn.className = "btn";
            saveBtn.textContent = "Save";
            contextualBox.appendChild(saveBtn);
            let i = 1;
            if (notes) {
                i = notes.length + 1;
            }
            saveBtn.addEventListener("click", () => {
                noteBtn.removeAttribute("saved");
                noteBtn.removeEventListener("click", tempClickListener);
                unsavedNotes.splice(unsavedIndex, 1);
                saveHandler(rect, span, i);
            });
        }
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
        const settingDiv = document.getElementById("settingDiv");
        if (settingDiv) {
            settingDiv.parentNode.removeChild(settingDiv);
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
        note1.setAttribute("saved", "false");
        note1.addEventListener("click", () => { tempClickListener(notes, span, rect, note1) });
        tabDiv.appendChild(note1);
        let notesDiv = document.getElementById("notesDiv");
        if (!notesDiv) {
            notesDiv = document.createElement("textarea");
            notesDiv.id = "notesDiv";
            contextualBox.appendChild(notesDiv);
        }
        notesDiv.value = "";
        notesDiv.addEventListener("input", () => {
            let text = notesDiv.value;
            let noteIndex = unsavedNotes.findIndex(note => note.note === note1.id);
            if (noteIndex !== -1) {
                unsavedNotes[noteIndex].text = text;
            }
            else {
                unsavedNotes.push({
                    note: note1.id,
                    text: text
                })
            }
        })
        let saveBtn = document.getElementById("saveBtn");
        if (!saveBtn) {
            saveBtn = document.createElement("button");
            saveBtn.id = "saveBtn";
            saveBtn.className = "btn";
            saveBtn.textContent = "Save";
            contextualBox.appendChild(saveBtn);
            let i = 1;
            if (notes) {
                i = notes.length + 1;
            }
            saveBtn.addEventListener("click", () => {
                note1.removeAttribute("saved");
                // note1.removeEventListener("click", tempClickListener);
                saveHandler(rect, span, i);
            });
        }

    })
    tabDiv.appendChild(addNoteBtn);
    if (notes && notes.length > 0) {
        notes && notes.forEach((note, i) => {
            const noteBtn = document.createElement("button");
            noteBtn.id = `note#${i + 1}`;
            noteBtn.textContent = `note#${i + 1}`;
            noteBtn.style.cursor = "pointer";
            noteBtn.className = "noteBtn";
            tabDiv.append(noteBtn);
            noteBtn.addEventListener("click", () => {
                noteBtnClickListenerHandler(span, notes, note, rect, i + 1);
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

    let settingBtn = document.getElementById("settingBtn");
    settingBtn.addEventListener("click", () => {
        let index = allHighlights.findIndex(ele => JSON.stringify(ele["rect"]) === JSON.stringify(rect));
        let settingDiv = document.getElementById("settingDiv");
        if (!settingDiv) {

            const bgChangeDiv = document.createElement("div");
            bgChangeDiv.className = "settingParams";
            bgChangeDiv.textContent = "Background Color : ";
            const inputColor = document.createElement("input");
            inputColor.type = "color";
            inputColor.value = allHighlights[index].color;
            inputColor.id = "favColor";

            bgChangeDiv.appendChild(inputColor);


            const fontChangeDiv = document.createElement("div");
            fontChangeDiv.textContent = "Font Style : ";
            fontChangeDiv.id = "fontPicker";
            const fontSelect = document.createElement('select');
            fontSelect.name = "fontSelect";
            fontSelect.id = "fontSelect";
            const options = [
                { value: "Default", text: "Default" },
                { value: "Arial", text: "Arial" },
                { value: "Georgia", text: "Georgia" },
                { value: "Courier New", text: "Courier New" },
                { value: "Cursive", text: "Cursive" },
                { value: "Bold", text: "Bold" },
                { value: "Italic", text: "Italic" }
            ];

            options.forEach(optionData => {
                const option = document.createElement('option');
                option.value = optionData.value;
                option.text = optionData.text;
                fontSelect.appendChild(option);
            });

            const selectedFont = allHighlights[index].font;
            if (!selectedFont || selectedFont.trim() === "") {
                fontSelect.value = "Default";
            }
            else {
                fontSelect.value = selectedFont;
            }
            fontChangeDiv.appendChild(fontSelect);

            const textColorChangeDiv = document.createElement("div");
            textColorChangeDiv.textContent = "Text Color : ";

            textColorChangeDiv.className = "settingParams";
            const inputTextColor = document.createElement("input");
            inputTextColor.type = "color";
            inputTextColor.value = allHighlights[index].textColor;
            inputTextColor.id = "favTextColor";
            textColorChangeDiv.appendChild(inputTextColor);

            const saveBtn = document.getElementById("saveBtn");
            if (saveBtn) {
                saveBtn.parentNode.removeChild(saveBtn);
            }
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
            settingDiv = document.createElement("div");
            settingDiv.id = "settingDiv";

            settingDiv.appendChild(bgChangeDiv);
            settingDiv.appendChild(fontChangeDiv);
            settingDiv.appendChild(textColorChangeDiv);

            const saveSettingBtn = document.createElement("button");
            saveSettingBtn.id = "saveSettingBtn";
            saveSettingBtn.className = "btn";
            saveSettingBtn.textContent = "Save";

            saveSettingBtn.addEventListener("click", () => {
                saveSettingBtn.textContent = "Saved!";
                setTimeout(() => {
                    saveSettingBtn.textContent = "Save";
                }, 500);
                const bg = document.getElementById("favColor").value;
                const font = document.getElementById("fontSelect").value;
                const textColor = document.getElementById("favTextColor").value;
                span.style.backgroundColor = bg;
                span.style.fontFamily = font;
                span.style.color = textColor;

                allHighlights[index].color = bg;
                allHighlights[index].font = font;
                allHighlights[index].textColor = textColor;
                chrome.storage.sync.set({
                    [currentWebPage]: JSON.stringify(allHighlights)
                })

            })

            settingDiv.appendChild(saveSettingBtn);

            contextualBox.appendChild(settingDiv);


        }

    })
}
function wrapTextInSpan(startNode, textToWrap, color, font, textColor, rect, notes) {
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
                span.style.backgroundColor = color;
                span.style.fontFamily = font;
                span.style.color = textColor;
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
                        const settingDiv = document.getElementById("settingDiv");
                        if (settingDiv) {
                            settingDiv.parentNode.removeChild(settingDiv);
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
                        const settingDiv = document.getElementById("settingDiv");
                        if (settingDiv) {
                            settingDiv.parentNode.removeChild(settingDiv);
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
            wrapTextInSpan(startNode, element.text, element.color, element.font, element.textColor, element.rect, element.notes);
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
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
let yPosition = 20;
let lineHeight = 20;
function addUnderlinedText(pdf, text, x, lh, maxWidth, isHighlight, color = "") {
    const lines = pdf.splitTextToSize(text, maxWidth);

    lines.forEach((line) => {
        if (yPosition > pdf.internal.pageSize.getHeight()) {
            pdf.addPage();
            yPosition = 20;
        }
        pdf.text(line, x, yPosition);
        yPosition += lh;
    });
    if (isHighlight) {
        yPosition -= lh;
        const highlightColor = hexToRgb(color);
        pdf.setDrawColor(highlightColor.r, highlightColor.g, highlightColor.b);
        pdf.setLineWidth(0.5);
        pdf.line(10, yPosition + 2, 10 + pdf.getTextWidth(text), yPosition + 1);
        yPosition += lh;
    }
}
const addNotesToPdf = (pdf) => {
    const pageCount = pdf.getNumberOfPages();
    pdf.setPage(pageCount);
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    const text = "NOTES";
    // let yPosition = 20;
    // let lineHeight = 20;
    const textWidth = pdf.getTextWidth(text);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const xPosition = (pageWidth - textWidth) / 2;

    pdf.setFillColor(147, 129, 255);
    pdf.rect(xPosition - 4, yPosition - 10, textWidth + 8, 14, 'F');

    pdf.text('NOTES', xPosition, yPosition);
    yPosition += lineHeight;
    pdf.setTextColor(0, 0, 0);
    allHighlights.forEach((highlight) => {
        if (yPosition > pdf.internal.pageSize.getHeight()) {
            pdf.addPage();
            yPosition = 20;
        }
        const highlightText = highlight.text;
        pdf.setFontSize(20);
        // pdf.text(highlightText, 10, yPosition);
        addUnderlinedText(pdf, highlightText, 10, 20, pdf.internal.pageSize.getWidth() - 30, true, highlight.color);



        const notes = highlight.notes;
        notes && notes.forEach((note, index) => {
            pdf.setFontSize(16);
            if (yPosition > pdf.internal.pageSize.getHeight()) {
                pdf.addPage();
                yPosition = 20;
            }
            pdf.text((index + 1).toString() + ".", 15, yPosition);
            addUnderlinedText(pdf, note[0], 25, 15, pdf.internal.pageSize.getWidth() - 30, false);
            // yPosition += lineHeight;
        });
    })

}
const download = async (callback) => {
    try {
        await loadScript('libs/html2canvas.js');
        await loadScript('libs/jspdf.js');
        html2canvas(document.body, {
            width: document.body.scrollWidth,
            height: document.body.scrollHeight,
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg');
            const pdf = new jspdf.jsPDF();

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            let heightLeft = pdfHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }
            pdf.addPage();
            addNotesToPdf(pdf);
            pdf.save('highlights.pdf');
            if (callback) {
                callback();
            }
        });
    } catch (error) {
        console.error('Error loading scripts:', error);
    }
}

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
    else if (request.action == "download") {
        download(function () {
            response({ status: "completed" })
        });
        return true;
    }
    else if (request.action == "getElementByXPath") {
        const xPath = request.xPath;
        const element = getElementByXPath(xPath);
        element.scrollIntoView({
            behaviour: "smooth",
            block: "center",
            inline: "center"
        });
        element.style.backgroundColor = "rgba(0,0,0,0.4)";
        element.style.transition = "all 0.3s linear";
        setTimeout(() => {
            element.style.backgroundColor = "transparent";
        }, 700);
    }
    else if (request.action == "DELETE") {
        const highlight = request.highlight;
        const element = getElementByXPath(highlight.startXPath);
        const span = element.querySelector("span");
        span.style.backgroundColor = element.style.backgroundColor;
        span.style.color = element.style.color;
        span.style.fontFamily = element.style.fontFamily;
        showHighlights();
    }
});
