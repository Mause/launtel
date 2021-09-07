import { readFile, readdir, writeFile } from "fs/promises";
import { resolve } from "path";
import { parseDocument, YAMLMap } from "yaml";
import { validationMetadatasToSchemas } from "class-validator-jsonschema";

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
                    $ref: "#/components/schemas/DummyResponse",
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

  const schemas = doc.getIn(["components", "schemas"]) as YAMLMap<
    string,
    unknown
  >;
  schemas.items.push(
    ...(
      doc.createNode(
        validationMetadatasToSchemas({
          refPointerPrefix: "#/components/schemas/",
        })
      ) as YAMLMap<string, unknown>
    ).items
  );

  doc.setIn(
    ["components", "schemas", "DummyResponse"],
    doc.createNode({
      type: "object",
      required: ["id"],
      properties: { id: { type: "string" } },
    })
  );

  console.log(doc.toJSON());

  await writeFile(filename, doc.toString());
  await writeFile("openapi.yaml", doc.toString());
}

generateOpenapi().then(console.log.bind(console), console.error.bind(console));
