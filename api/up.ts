import Axios from "axios";

export default async function (req, res) {
  res.json(
    await Axios.get("https://api.up.com.au/api/v1/util/ping", {
      headers: { Authorization: "Bearer " + process.env.UP_TOKEN },
    })
  );
}
