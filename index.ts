import fse from "fs-extra";
import { parse } from "node-html-parser";
import path from "path";

const DIST = "./dist";
const HTML_DIR = "./html";

main();

function main() {
  const files = fse.readdirSync(HTML_DIR);
  files.forEach((file) => {
    traverseFile(path.join(HTML_DIR, file));
  });
}

function traverseFile(filePath: string) {
  const fileContent = fse.readFileSync(filePath, "utf-8");

  const root = parse(fileContent);

  const res = root.querySelectorAll(".content");
  res.forEach((el) => {
    const content = getEachContent(el.innerHTML);
    const parsedContent = parseContent(content);
    writeMd(parsedContent);
  });
}

// 从 .content 里拿到内容
function getEachContent(contentHtml: string): string {
  const contentEl = parse(contentHtml);
  const pElArray = contentEl.querySelectorAll("p");
  const content = pElArray.map((pEl) => pEl.innerText).join("\n");
  // console.log(content);
  return content;
}

interface ParseContentRes {
  tag: string;
  title: string;
  content: string;
}

function parseContent(rawContent: string): ParseContentRes {
  const tagRe = /^#[^\s]*/;
  const tag = tagRe.exec(rawContent.trim())?.[0].replace("#", "") ?? "unknown";
  const rawContentWithoutTag = rawContent.replace(`#${tag}`, "");
  const titleRe = /^.*/;
  const title =
    titleRe.exec(rawContentWithoutTag.trim())?.[0].replace(/\s/g, "") ??
    "unknown";
  const content = rawContentWithoutTag.replace(title, "").trim();

  return {
    tag,
    title: title.slice(0, 10),
    content: content.length ? content : title,
  };
}

function writeMd(parsedContent: ParseContentRes) {
  fse.outputFile(
    path.join(DIST, parsedContent.tag, `${parsedContent.title}.md`),
    parsedContent.content
  );
}
