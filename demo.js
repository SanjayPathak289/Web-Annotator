let contextualBox;

function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

const makeContextualBox = () => {
    contextualBox = document.createElement("div");
    contextualBox.id = "hover-box";
    contextualBox.style.position = "absolute";
    contextualBox.style.border = '1px solid black';
    contextualBox.style.backgroundColor = 'yellow';
    contextualBox.style.padding = '5px';
    contextualBox.style.zIndex = '1000';
    contextualBox.style.display = 'none';
    contextualBox.style.minWidth = '300px';
    contextualBox.style.height = '300px';

    const tabDiv = document.createElement("div");
    tabDiv.id = "tabDiv";
    tabDiv.style.display = "flex";
    tabDiv.style.flexDirection = "row-reverse";
    contextualBox.appendChild(tabDiv);
}
makeContextualBox();

const showContextualBox = (span, rect, notes) => {
    if (contextualBox.style.display == "none") {
        let div = document.getElementById("hover-box");
        if (div) {
            div.parentNode.removeChild(div);
        }

        contextualBox.style.left = `${Math.abs(150 - rect.width / 2)}px`;
        contextualBox.style.bottom = `${rect.height}px`;

        span.appendChild(contextualBox);
        contextualBox.style.display = "block";

        if (notes && notes.length > 0) {
            const tabDiv = document.getElementById("tabDiv");
            tabDiv.innerHTML = "";
            notes.forEach((note) => {
                const noteBtn = document.createElement("button");
                noteBtn.id = "noteBtn";
                noteBtn.textContent = `note${note[0]}`;
                noteBtn.style.cursor = "pointer";
                tabDiv.append(noteBtn);
                noteBtn.addEventListener("click", () => {
                    let notesDiv = document.getElementById("notesDiv");
                    if (!notesDiv) {
                        notesDiv = document.createElement("textarea");
                        notesDiv.id = "notesDiv";
                        contextualBox.appendChild(notesDiv);
                    }
                    notesDiv.innerText = note;
                });
            });
        }
        else {

        }
    }
}

function wrapTextInSpan(startNode, textToWrap, color, rect, notes) {
    let currentNode = startNode;

    function recursiveWrap(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            let index = text.indexOf(textToWrap);
            if (index !== -1) {
                let beforeText = text.slice(0, index);
                let afterText = text.slice(index + textToWrap.length);

                let span = document.createElement('span');
                span.className = `highlight-${color}`;
                span.textContent = textToWrap;
                span.style.position = "relative";

                span.addEventListener("mouseover", () => showContextualBox(span, rect, notes));
                span.addEventListener("mouseout", (event) => {
                    if (!contextualBox.contains(event.relatedTarget) && !span.contains(event.relatedTarget)) {
                        const saveBtn = document.getElementById("saveBtn");
                        if (saveBtn) {
                            saveBtn.parentNode.removeChild(saveBtn);
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
                        contextualBox.style.display = "none";
                    }
                });

                let beforeNode = document.createTextNode(beforeText);
                let afterNode = document.createTextNode(afterText);

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
    allHighlights.forEach(element => {
        var startNode = getElementByXPath(element.startXPath);
        wrapTextInSpan(startNode, element.text, element.color, element.rect, element.notes);
    });


}

showHighlights();
