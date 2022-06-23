import { create } from "ipfs-core";
import axios from "axios";

let node = null;

async function createNode(options) {
  if (node === null) {
    node = await create(options);
  }
  return node;
}

export async function addFile(name, content) {
  if (node === null) {
    throw new Error("ipfs not initialized");
  }

  try {
    const formdata = new FormData();
    formdata.append("file", content);

    const result = await axios.post(
      `https://ipfs.infura.io:5001/api/v0/adds`,
      formdata,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    console.log("infura add file", result.data.Hash);
  } catch (error) {
    console.log(error);
  }

  const fileToAdd = {
    path: name,
    content: content
  };
  const file = await node.add(fileToAdd);
  return file.cid.toString();
}

export async function catFile(hash) {
  const result = await axios.get(`https://ipfs.io/ipfs/${hash}`);
  return result.data;
}

export default {
  install: (app, options) => {
    app.config.globalProperties.$ipfs = createNode(options);
  }
};
