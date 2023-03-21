console.clear();

function sortTopLeftFirst(node1: SceneNode, node2: SceneNode) {
  const x1 = node1.absoluteTransform[0][2];
  const x2 = node2.absoluteTransform[0][2];
  const y1 = node1.absoluteTransform[1][2];
  const y2 = node2.absoluteTransform[1][2];
  if (y1 < y2) return -1;
  else if (y1 > y2) return 1;
  else {
    if (x1 < x2) return -1;
    else if (x1 > x2) return 1;
    else return 0;
  }
}

// custom traversal to avoid hidden layers
// `findAll` will still finds visible children with hidden parents
function findTextNodes(node: SceneNode, regex: RegExp, maxDepth = 1000) {
  const queue = [node];
  const found: TextNode[] = [];
  while (queue.length > 0 && found.length < maxDepth) {
    const node = <SceneNode>queue.shift();
    if (node.type === "TEXT" && node.characters.match(regex)) {
      found.push(node);
    }
    if ("children" in node) {
      if (node.visible) {
        for (const child of node.children) {
          queue.push(child);
        }
      }
    }
  }
  return found;
}

async function sequenceText(textNodes: TextNode[]) {
  let number = 1;
  let foundNumber = false;
  const loadedFonts = new Set<FontName>();

  for (const textNode of textNodes) {
    if (textNode.hasMissingFont) {
      figma.notify("Can't complete-the font is missing");
      figma.closePlugin();
    }
    if (textNode.fontName === figma.mixed) {
      figma.notify("Can't complete: Text Frame has mixed fonts");
      figma.closePlugin();
    }
    const match = textNode.characters.match(/\d+/g);
    if (match) {
      if (!foundNumber) {
        number = parseInt(match[0]);
        foundNumber = true;
      }
      const fontName = <FontName>textNode.fontName;
      if (!loadedFonts.has(fontName)) {
        await figma.loadFontAsync(<FontName>textNode.fontName);
        loadedFonts.add(fontName);
      }
      const textContent = textNode.characters;
      textNode.deleteCharacters(0, textContent.length);
      textNode.insertCharacters(
        0,
        textContent.replace(/\d+/g, number.toString())
      );
      number++;
    }
  }
  return;
}

if (figma.editorType === "figma") {
  const selection = figma.currentPage.selection;

  if (!selection.length) {
    figma.notify("You need to select frames to run this plugin");
    figma.closePlugin();
  }

  const textNodes = [...selection]
    .flatMap((selected: SceneNode) => findTextNodes(selected, /\d+$/))
    .sort(sortTopLeftFirst);

  sequenceText(textNodes)
    .then(() => figma.closePlugin())
    .catch((e) => console.log(e));
} else {
  // todo for FigJam
}
