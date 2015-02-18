using FacebookCoverPhoto.Models;
using PasswordHash;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Threading;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;

namespace FacebookCoverPhoto.Controllers
{
    public class HomeController : Controller
    {
        dbEntities db = new dbEntities();

        public ActionResult Index(int Id = 0)
        {
            //Query string ile id gelirse ise
            if (Id != 0)
            {
                Session["UserId"] = Id;
            }

            //Varsayılan kullanıcı olarak veritabanındaki 1 id li kullanıcıyı sessiona ekliyoruz
            if (Session["UserId"] == null)
            {
                Session["UserId"] = "1";
            }

            if (Session["UserId"] != null)
            {
                int userId = Convert.ToInt32(Session["UserId"]);

                var user = db.Users.SingleOrDefault(m => m.Id == userId);

                return View(user);
            }

            return Content("Session Error!");
        }

        [HttpPost]
        //Resim yükleme
        public ActionResult UploadPhoto(FormCollection formCollection)
        {
            try
            {
                if (Request.Files.AllKeys.Any())
                {
                    var httpPostedFile = Request.Files["UploadedImage"];

                    if (httpPostedFile != null)
                    {
                        //Resim dosyasının adını benzersiz yapmak için saatten ve Guid den faydaladık
                        string dateTimeFileName = string.Format("{0:dMyyyyHHmmss}", DateTime.Now);
                        string imgName = Encrypt.MD5(dateTimeFileName + Guid.NewGuid()).ToLower() + ".jpg";

                        string imgUrl = Path.Combine(Server.MapPath("~/images"), imgName);

                        //Post ile gelen resim verisini bitmap kullanarak Jpeg formatına dönüştürme işlemi
                        Bitmap bmp = new Bitmap(httpPostedFile.InputStream);

                        //Sadece Jpeg formatı geçerli
                        if (!bmp.RawFormat.Equals(System.Drawing.Imaging.ImageFormat.Jpeg))
                        {
                            return Json(new { status = false, msg = "Fotoğraf JPEG formatında olmalı." });
                        }

                        //Resim boyutlarını konral ettik
                        if (bmp.Height < 350 && bmp.Width < 350)
                        {
                            return Json(new { status = false, msg = "Fotoğraf en az 350 piksel genişliğinde ve en az 350 piksel yüksekliğinde olmalı." });
                        }

                        ImageHandler imgHandler = new ImageHandler();

                        //maxWidth 970 olarak ayarlandı. Ve resim kalitesini 100 yaptık
                        imgHandler.Save(bmp, 970, 100, imgUrl);

                        return Json(new { status = true, imgUrl = "/images/" + imgName });
                    }
                }
                return Json(new { status = false, msg = "Resim dosyası seçiniz." });
            }
            catch (Exception)
            {
                return Json(new { status = false, msg = "Hata oluştu. Lütfen tekrar deneyin." });
            }
        }

        [HttpPost]
        //Konumu alarlanmış resimi keserek kaydetme
        public ActionResult Save(string imgName, string top)
        {
            try
            {
                //Resim adını ayıklıyoruz
                imgName = imgName.Substring(imgName.LastIndexOf('/') + 1, imgName.LastIndexOf(".jpg") - 4);
                top = top.Split('.')[0];

                string imgUrl = Path.Combine(Server.MapPath("~/images"), imgName);
                int itop = Convert.ToInt32(top);

                itop = Math.Abs(itop);

                WebImage imgCrop = new WebImage(imgUrl);
                //Kesme işlemini gelen top değerine göre height 350 olacak şekilde kesiyoruz
                imgCrop.Crop(top: itop, bottom: ((imgCrop.Height - itop) - 350));
                imgCrop.Save(Path.Combine(Server.MapPath("~/images/"), "c-" + imgName));
            }
            catch (Exception)
            {
                return Json(new { status = false, msg = "Kapak fotoğrafı güncellenemedi. Lütfen tekrar deneyin." });
            }

            int userId = Convert.ToInt32(Session["UserId"]);

            //Veritabanına kaydetme
            var user = db.Users.SingleOrDefault(m => m.Id == userId);
            user.CoverPhotoName = imgName;
            db.SaveChanges();

            return Json(new { status = true });
        }

        [HttpPost]
        //İptal edildiğinde yüklenen resimi silme
        public ActionResult Delete(string imgName)
        {
            try
            {
                imgName = imgName.Substring(imgName.LastIndexOf('/') + 1, imgName.LastIndexOf(".jpg") - 4);
                string imgUrl = Path.Combine(Server.MapPath("~/images"), imgName);

                if (System.IO.File.Exists(imgUrl))
                {
                    System.IO.File.Delete(imgUrl);
                }
            }
            catch (Exception)
            {
                return Json(new { status = false });
            }

            return Json(new { status = true });
        }

        [HttpPost]
        //Fotoğrafı kaldırma
        public ActionResult CoverPhotoDelete()
        {
            try
            {
                int userId = Convert.ToInt32(Session["UserId"]);

                var user = db.Users.SingleOrDefault(m => m.Id == userId);

                string imgUrl = Path.Combine(Server.MapPath("~/images"), user.CoverPhotoName);
                string imgUrlc = Path.Combine(Server.MapPath("~/images"), "c-" + user.CoverPhotoName);

                if (System.IO.File.Exists(imgUrl) && System.IO.File.Exists(imgUrlc))
                {
                    System.IO.File.Delete(imgUrl);
                    System.IO.File.Delete(imgUrlc);
                }

                user.CoverPhotoName = null;

                db.SaveChanges();

                return Json(new { status = true });
            }
            catch (Exception)
            {

                return Json(new { status = false });
            }
        }
    }
}