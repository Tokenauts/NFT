import { useMoralis, useWeb3Contract } from "react-moralis";
import { abi } from "../constants/abi";
import { useState, useEffect } from "react";
import { ASSETS } from "../components/assets";

export default function Home() {
  const [bodyType, setBodyType] = useState("square"); // Default to square
  const [body, setBody] = useState("bodies-01.png");
  const [hand, setHand] = useState("hands-01.png");
  const [leg, setLeg] = useState("legs-01.png");
  const [image, setImage] = useState(null);
  const [tokenURI, setTokenURI] = useState(null);
  const [generatedImage, setGeneratedImage] = useState(null); // New state for storing the generated image blob
  const [nftName, setNftName] = useState(""); // New state for NFT name

  const pinataApiKey = "108cc1670185cc3651d6";
  const pinataSecretApiKey =
    "10ba300f81944bcec510d3bd8380de5c7ef04a02c29dcfba097a38e495c1aa41";
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const bodyImages = ASSETS[bodyType].bodies.map((bodyOption, i) => (
    <img
      key={i}
      src={`assets/${bodyType}/bodies/${bodyOption}`}
      onClick={() => setBody(bodyOption)}
      alt={`Body ${i}`}
      style={{
        cursor: "pointer",
        height: "100px",
        width: "100px",
        border: body === bodyOption ? "2px solid red" : "none",
      }}
    />
  ));

  const handImages = ASSETS[bodyType].hands.map((handOption, i) => (
    <img
      key={i}
      src={`assets/${bodyType}/hands/${handOption}`}
      onClick={() => setHand(handOption)}
      alt={`Hand ${i}`}
      style={{
        cursor: "pointer",
        height: "100px",
        width: "100px",
        border: hand === handOption ? "2px solid red" : "none",
      }}
    />
  ));

  const legImages = ASSETS[bodyType].legs.map((legOption, i) => (
    <img
      key={i}
      src={`assets/${bodyType}/legs/${legOption}`}
      onClick={() => setLeg(legOption)}
      alt={`Leg ${i}`}
      style={{
        cursor: "pointer",
        height: "100px",
        width: "100px",
        border: leg === legOption ? "2px solid red" : "none",
      }}
    />
  ));

  const generateImage = async (e) => {
    e.preventDefault();

    const width = 1000; // Image width
    const height = 1000; // Image height

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;

    const parts = ["bodies", "hands", "legs"];
    const images = [body, hand, leg].map((part, i) => {
      const img = new window.Image();
      img.src = `assets/${bodyType}/${parts[i]}/${part}`;
      return img;
    });

    for (let i = 0; i < images.length; i++) {
      await new Promise((r) => (images[i].onload = r));
      context.drawImage(images[i], 0, 0, width, height);
    }

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );

    setGeneratedImage(blob); // Store the generated image blob

    const objectURL = URL.createObjectURL(blob);
    setImage(objectURL); // Set the preview image URL
  };

  const uploadToIPFS = async () => {
    let data = new FormData();
    data.append("file", generatedImage, "NFT.png");

    let res = await fetch(url, {
      method: "POST",
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
      body: data,
    });

    if (res.ok) {
      const result = await res.json();
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      const imageIpfsUri = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;

      // Create metadata
      // Create metadata
      // Create metadata
      const metadata = {
        name: nftName,
        image: imageIpfsUri,
        attributes: [
          {
            trait_type: "Level",
            value: 1, // Add level attribute
          },
          {
            trait_type: "Strength",
            value: Math.floor(Math.random() * 10), // Random value between 0 and 99
          },
          {
            trait_type: "Agility",
            value: Math.floor(Math.random() * 10), // Random value between 0 and 99
          },
          {
            trait_type: "Wisdom",
            value: Math.floor(Math.random() * 10), // Random value between 0 and 99
          },
        ],
        // Add more properties as per your requirement
      };

      data = new FormData();
      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: "application/json",
      });
      data.append("file", metadataBlob, "metadata.json");

      res = await fetch(url, {
        method: "POST",
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretApiKey,
        },
        body: data,
      });

      if (res.ok) {
        const metadataResult = await res.json();
        const metadataIpfsUri = `https://gateway.pinata.cloud/ipfs/${metadataResult.IpfsHash}`;
        setTokenURI(metadataIpfsUri);
        console.log(`Metadata upload : ${res.status}`);
      } else {
        console.log(`Metadata upload error: ${res.status}`);
      }
    } else {
      console.log(`Image upload error: ${res.status}`);
    }
  };

  const mintNFT = async () => {
    // Check if tokenURI is a valid URL
    try {
      new URL(tokenURI);
    } catch (_) {
      console.log("Invalid tokenURI, can't mint NFT");
      return;
    }

    try {
      await runContractFunction();
      console.log("Minted");
    } catch (error) {
      console.log(`Minting error: ${error}`);
    }
  };

  const [hasMetamask, setHasMetamask] = useState(false);
  const { enableWeb3, isWeb3Enabled } = useMoralis();

  const { data, error, runContractFunction, isFetching, isLoading } =
    useWeb3Contract({
      abi: abi,
      contractAddress: "0xba1EEb5910f34E3d2912923A6492e36cB85E35DC", // your contract address here
      functionName: "mintNFT",
      params: {
        recipient: "0xD44978cB905A505c6228f57465dB17b172fb880F",
        tokenURI: tokenURI,
      },
    });

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      setHasMetamask(true);
    }
  });

  return (
    <div>
      <div>
        {hasMetamask ? (
          isWeb3Enabled ? (
            "Connected!"
          ) : (
            <button
              className="bg-gray-100 rounded-md p-2 right-0"
              onClick={() => enableWeb3()}
            >
              Connect
            </button>
          )
        ) : (
          "Please install metamask"
        )}

        {isWeb3Enabled && (
          <button className="bg-gray-100 rounded-md p-2" onClick={uploadToIPFS}>
            Upload to IPFS
          </button>
        )}
        {isWeb3Enabled && tokenURI && (
          <button className="bg-gray-100 rounded-md p-2" onClick={mintNFT}>
            Execute
          </button>
        )}
      </div>
      <div>
        <form onSubmit={generateImage}>
          <div>
            <label>NFT Name</label>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
            />
          </div>
          <div>
            <label>Body Type</label>
            <select
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
            >
              <option value="square">Square</option>
              <option value="circle">Circle</option>
              <option value="polygon">Polygon</option>
            </select>
          </div>
          <div>
            <label>Body</label>
            <div
              className="image-selection"
              style={{ display: "flex", flexDirection: "row" }}
            >
              {bodyImages}
            </div>
          </div>
          <div>
            <label>Hand</label>
            <div
              className="image-selection"
              style={{ display: "flex", flexDirection: "row" }}
            >
              {handImages}
            </div>
          </div>
          <div>
            <label>Leg</label>
            <div
              className="image-selection"
              style={{ display: "flex", flexDirection: "row" }}
            >
              {legImages}
            </div>
          </div>

          <button type="submit" className="bg-gray-100 rounded-md p-2 ">
            Create NFT
          </button>
        </form>
        {image && (
          <img
            src={image}
            alt="Generated NFT"
            style={{ height: "500px", width: "500px" }}
          />
        )}
      </div>
    </div>
  );
}
