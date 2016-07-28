function getValuesAsElements(rule, elements) {
    var values = [];
    if (elements.length) {
        for (var i = rule.offset.from; i < (rule.offset.to || elements.length); i++) {
            values.push(getValue(elements[i], rule.attribute));
        }
    }
    return eval("values.map(function(x){" + rule.function+"})");
}

function getValue(element, attribute) {
    if (attribute.match(/^(innerText|value|innerHTML)$/)) {
        return element[attribute];
    }
    return element.getAttribute(attribute);
}

function sortNodes(a, b) {
    if (a.element.index < b.element.index) {
        return -1;
    } else if (a.element.index > b.element.index) {
        return 1;
    }
    return 0;
}

function getIndex(element, all) {
    for (var i = 0; i < all.length; i++) {
        if (element === all[i]) {
            break;
        }
    }
    return i;
}

function getValuesAsProperties(propertyRules, elements) {
    function offsettedLength(selector, rules) {
        var lowestOffsetFromStart = elements[selector].length - 1,
            lowestOffsetFromEnd = 0;
        rules.filter(function(e) {
            if (e.rule.offset.from < lowestOffsetFromStart) {
                lowestOffsetFromStart = e.rule.offset.from;
            }
            if (e.rule.offset.to > lowestOffsetFromEnd) {
                lowestOffsetFromEnd = e.rule.offset.to;
            }
        });
        offsets[selector] = {
            start: lowestOffsetFromStart,
            end: (lowestOffsetFromEnd || elements[selector].length),
            len: [].slice.call(elements[selector]).slice(lowestOffsetFromStart, (lowestOffsetFromEnd || elements[selector].length)).length
        };
        return offsets[selector].len;
    }
    var offsets = {};
    var values = [];
    var selectors = Object.getOwnPropertyNames(propertyRules);
    selectors.filter(function(selector) {
        offsettedLength(selector, propertyRules[selector]);
    });
    var sortedNodes = [];
    for (var y = 0; y < selectors.length; y++) {
        for (var i = offsets[selectors[y]].start; i < offsets[selectors[y]].end; i++) {
            sortedNodes.push({
                selector: y,
                element: {
                    dom: elements[selectors[y]][i],
                    index: getIndex(elements[selectors[y]][i], elements["*"])
                }
            });
        }
    }
    sortedNodes.sort(sortNodes);
    var selecAll = selectors.map(function(s) {
        return s.split(">");
    });
    for (var s = 0; s < sortedNodes.length; s++) {
        var tempElements = [];
        var parent = sortedNodes[s].element.dom.parentNode;
        var p = 1;
        var found = true;
        var selecs = selecAll.map((c) => {
            return c.slice(c.length - p, c.length).join(">");
        });
        while (parent) {
            tempElements = [];
            var toBreak = false;
            found = true;
            for (var e = 0; e < selecs.length; e++) {
                var t = parent[typeof $ === "undefined" ? "querySelectorAll" : "find"](selecs[e]);
                if (t.length < 1) {
                    found = false;
                    break;
                } else if (t.length > 1) {
                    found = false;
                    toBreak = true;
                    break;
                } else {
                    tempElements.push({
                        selector: e,
                        element: {
                            dom: t[0]
                        }
                    });
                }
            }
            if (toBreak || found) {
                break;
            } else {
                parent = parent.parentNode;
                p++;
                selecs = selecAll.map(function(c) {
                    return c.slice(c.length - p, c.length).join(">");
                });
            }
        }
        if (found) {
            break;
        }
    }
    tempElements.map(function(e) {
        e.element.index = getIndex(e.element.dom, elements["*"]);
    });
    tempElements.sort(sortNodes);
    var selectorOrder = tempElements.map(function(e) {
        return e.selector;
    });
    var tempValue = {};
    var lastSelectorIndex = -1;
    for (var u = 0; u < sortedNodes.length; u++) {
        var currentSelectorIndex = selectorOrder.indexOf(sortedNodes[u].selector);
        if (currentSelectorIndex <= lastSelectorIndex) {
            values.push(tempValue);
            tempValue = {};
            lastSelectorIndex = -1;
        } else {
            lastSelectorIndex = currentSelectorIndex;
        }
        propertyRules[selectors[sortedNodes[u].selector]].filter(function(e) {
            tempValue[e.property.substr(1)] = eval("(function(x){" +
                e.rule.function+"})(getValue(sortedNodes[u].element.dom, e.rule.attribute))");
        });
    }
    if (Object.getOwnPropertyNames(tempValue).length) {
        values.push(tempValue);
    }
    return values;
}
module.exports = {
    getValuesAsElements: getValuesAsElements,
    getValue: getValue,
    sortNodes: sortNodes,
    getIndex: getIndex,
    getValuesAsProperties: getValuesAsProperties
};
