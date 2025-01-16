const fs = require("fs");

const isFile = (fileName) => {
  return fs.lstatSync(fileName).isFile();
};

function getImportsFromFile(data) {
  const regex = /^import[^;]*/gm;
  //read file and get all imports
  const found = data.match(regex);
  return found;
}
function getFilesWithPathFromDirRec(dir) {
  const jsFiles = [];
  const dirs = [dir];
  while (dirs.length !== 0) {
    const files = fs.readdirSync(dirs[0]);
    files.forEach((e) => {
      let path = dirs[0];
      if (isFile(path + "/" + e)) {
        if (e.split(".")[1] === "js" || e.split(".")[1] === "jsx") {
          jsFiles.push(path + "/" + e);
        }
      } else {
        dirs.push(path + "/" + e);
      }
    });
    dirs.shift();
  }
  return jsFiles;
}

function getImportsThatExistFromFile(data, filesWithDirs) {
  const imports = getImportsFromFile(data);

  if (!imports) {
    return;
  }

  const cleanedData = imports
    .map((e) => {
      const splited = e.split("from");
      const str = splited[1]?.replaceAll(/@|"|\.\.\/|\./g, "").trim();
      const internalImports = filesWithDirs.find((element) => {
        if (element?.includes(str)) {
          return element.split("/").pop();
        }
      });
      if (internalImports) {
        return internalImports.split("/").pop();
      }
      return internalImports;
    })
    .filter((e) => e !== undefined);
  return cleanedData;
}

export function createTreeGraph(dir) {
  let treeObj = {};
  let filesWithPath = getFilesWithPathFromDirRec(dir);
  filesWithPath.forEach((e) => {
    const data = fs.readFileSync(e, "utf8");
    let key = e.split("/").pop();
    let imports = getImportsThatExistFromFile(data, filesWithPath);
    treeObj[key] = { ...imports };
  });
  return treeObj;
}
