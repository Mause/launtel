import { readFile, readdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { parseDocument, YAMLMap } from "yaml";
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'

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
                      $ref: "#/components/schemas/DummyResponse",
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
  
  const schemas = doc.getIn(["components", "schemas"]) as YAMLMap<string, unknown>;
  schemas.update(validationMetadatasToSchemas({refPointerPrefix: '#/components/schemas/'}));

  doc.setIn(
    ["components", "schemas", "DummyResponse"],
    parseDocument(
      JSON.stringify({
        type: "object",
        required: ["id"],
        properties: { id: { type: "string" } },
      })
    )
  );

  console.log(doc.toJSON());

  await writeFile(filename, doc.toString());
  await writeFile("openapi.yaml", doc.toString());
}

generateOpenapi().then(console.log.bind(console), console.error.bind(console));
