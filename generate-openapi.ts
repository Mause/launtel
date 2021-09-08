import { readFile, readdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { parseDocument, YAMLMap } from "yaml";
import { validationMetadatasToSchemas } from "class-validator-jsonschema";

const dir = "api";

async function generateOpenapi() {
  const filename = resolve(dir + "/openapi.yaml");
  console.log(filename);
  const doc = parseDocument((await readFile(filename)).toString());

  process.env.JWT_SECRET = "SECRET"; // play pretend

  const paths = doc.get("paths") as YAMLMap<string, {}>;
  for (const filename of await readdir(resolve(dir))) {
    const name = filename.substr(0, filename.lastIndexOf("."));
    if (name != "openapi.yaml" && filename.endsWith(".ts")) {
      const path = `/api/${name}`;
      const endpoint = require("." + path); // register models
      if (!endpoint.responseShape) {
        throw new Error(`Missing responseShape for ${path}`);
      }
      let value = paths.get(path) as YAMLMap<string, {}>;
      if (!value) {
        value = new YAMLMap();
        const get = new YAMLMap();
        value.set("get", get);
        get.set(
          "operationId",
          "get" + name[0].toUpperCase() + name.substring(1)
        );
        get.set(
          "responses",
          doc.createNode({
            default: {
              description: "Ok",
              content: {
                "application/json": {
                  schema: {
                    $ref:
                      "#/components/schemas/" + endpoint.responseShape
                  },
                },
              },
            },
          })
        );
      }
      paths.set(path, value);
    }
  }

  doc.setIn(
    ["components", "schemas"],
    doc.createNode(
      validationMetadatasToSchemas({
        refPointerPrefix: "#/components/schemas/",
      })
    )
  );

  console.log(JSON.stringify(doc, undefined, 2));

  await writeFile("openapi.yaml", doc.toString());
}

generateOpenapi().catch((error) => {
  console.error(error);
  process.exit(-1);
});
