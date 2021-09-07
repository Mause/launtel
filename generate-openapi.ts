import { readFile, readdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { parseDocument, YAMLMap } from "yaml";

const dir = "api";

async function generateOpenapi() {
  const filename = resolve(dir + "/openapi.yaml");
  console.log(filename);
  const doc = parseDocument((await readFile(filename)).toString());

  const paths = doc.get("paths") as YAMLMap<string, {}>;
  for (const filename of await readdir(resolve(dir))) {
    const name = filename.substr(0, filename.lastIndexOf("."));
    if (name != "openapi.yaml" && filename.endsWith(".ts")) {
      const path = `/api/${name}`;
      let value = paths.get(path) as YAMLMap<string, {}>;
      if (!value) {
        value = new YAMLMap();
        value.set(
          "operationId",
          "get" + name[0].toUpperCase() + name.substring(1)
        );
        value.set(
          "responses",
          parseDocument(
            JSON.stringify({
              default: {
                description: "Ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" } },
                    },
                  },
                },
              },
            })
          )
        );
      }
      paths.set(path, value);
    }
  }

  console.log(doc.toJSON());

  await writeFile(filename, doc.toString());
}

generateOpenapi().then(console.log.bind(console), console.error.bind(console));
