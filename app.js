const express = require("express");
require("dotenv").config();
const multer = require("multer");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = require("./models/userSchema.js");
const connectDB = require("./db/index.js");
const cookieParser = require("cookie-parser");
const path = require("path");
const connectCloudinary = require("./uploads/index.js");
const upload = require("./uploads/config.js");
const cloudinary = require("cloudinary");

const app = express();
const port = process.env.PORT || 3000;

connectDB();
connectCloudinary();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname,"views"))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", async (req, res) => {
  res.render("index");
});
app.post("/signup", upload.single("image"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const image = req.file.path;
    const imgupld = await cloudinary.uploader.upload(image, {
      public_id: `${name}-img`,
      transformation: [
        { quality: "auto" }, // Automatically adjust quality for smaller file size
        { fetch_format: "auto" },
      ],
    });

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    if (await users.findOne({ email: email })) {
      return res.status(400).json({ message: "User Already Exist" });
    } else {
      const user = await users.create({
        name,
        email,
        password: hash,
        image : imgupld.url,
      });

      res.status(201).redirect("/login");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res
          .status(400)
          .json({ message: "Something Went wrong", error: err });
      }
      if (!result) {
        console.log(result)

        return res.status(400).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
      res.cookie("token", token);
      res.status(200).redirect("/profile")
    });
  } catch (e) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/profile", isLoggein, async(req, res) => {
  const token = req.cookies.token;
  const userId = jwt.verify(token, process.env.SECRET_KEY);
  const user = await users.findOne({_id: userId.id})
  res.render("profile", {user});
});
app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "You are logged out" });

});
function isLoggein(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    res.redirect("login");
  } else {
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) {
        res.send("Not authorized");
      } else {
        req.user = user;
        next();
      }
    });
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
