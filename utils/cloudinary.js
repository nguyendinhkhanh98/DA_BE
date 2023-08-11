var cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const http = require('http');
const fs = require('fs');

cloudinary.config({
  cloud_name: 'dsnzjlzec',
  api_key: '611136737175439',
  api_secret: 'wqxQnRJOAk51-TYGDOOhAPsTXmY'
});
let cloudinaryUtils= {}
cloudinaryUtils.uploadSingleByPath = (file) => {
  return new Promise(resolve => {
    cloudinary.uploader.upload(file, {
      folder: 'single'
    })
    .then(result => {
        if (result) { 
          resolve(result)
        }
    })
  })
}
cloudinaryUtils.deleteSingle = (url) => {
    try{
        let public_ids=url.slice(url.indexOf(`upload/`)==-1?0:url.indexOf(`upload/`)+7).split(`/`).slice(1).join(`/`).replace(/\..*/,"")||""
        console.log(`public_ids`, public_ids)
        return new Promise(resolve => {
            cloudinary.api.delete_resources([public_ids])
                .then(result => {
                    if (result) {
                        resolve({
                            message:result
                        })
                    }
                })
                .catch(err=> reject({message:err}))
        })
    }
    catch(err){
        return new Promise((resolve=>{resolve("ok")}))
    }
   
    }
    // if(deleteProduct) await uploadFile.deleteSingle(deleteProduct.imgUrl) dùng cái này
    // req.body.imgUrl = await uploadFile.uploadSingle(req.file, {folder:"product"})
cloudinaryUtils.uploadSingle=(file, options={})=>{
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(options,
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
    });
}
cloudinaryUtils.reSizeImage = (id, h, w) => {
        return cloudinary.url(id, {
            height: h,
            width: w,
            crop: 'scale',
            format: 'jpg'
        })
}

cloudinaryUtils.downloadFile  = (url, dest, cb) => {
  const file = fs.createWriteStream(dest);
  http.get(url, function (res) {
      //res.setEncoding('binary');
      res.pipe(file);
      file.on('finish', function () {
          file.close(cb);
      });
  });
}
module.exports= cloudinaryUtils