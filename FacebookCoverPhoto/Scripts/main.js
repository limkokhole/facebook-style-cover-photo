$(document).ready(function () {
    $('img.lazy').lazy();

    //Fotoğrafın olup olmaması durumunda menüyü düzenle
    menuNoPhotoHidden();

    //Kapak fotoğrafını güncelle
    $('#WallCover .photo .actions .update').on("click", function (e) {
        e.preventDefault();
        $('#WallCover .photo .actions .chooser').toggleClass('chooserhover');
        $('#WallCover .sub-menu').toggle();
    });

    //Resim seçme
    $('#WallCover .photo .actions .upload').on("click", function (e) {
        e.preventDefault();
        $('#WallCover form input[type=file]').click();
    });


    $('#WallCover form input[type=file]').on('change', function () {
        if ($('#WallCover form input[type=file]').val() != "") {
            $('#WallCover .photo .actions .chooser').hide();
            $('#WallCover .sub-menu').hide();

            var formData = new FormData();

            var files = $('#WallCover form input[type=file]').get(0).files;

            if (files.length > 0) {
                formData.append('UploadedImage', files[0]);
            }

            $.ajax({
                url: '/Home/UploadPhoto',
                type: 'POST',
                data: formData,
                cache: false,
                contentType: false,
                processData: false,
                beforeSend: function () {
                    $('#WallCover .uploadProgress').show()
                    $('#WallCover .footer .user-info').addClass('spc');
                },
                success: function (data) {
                    if (data.status == true) {
                        $('#WallCover img.default-cover-photo').hide();
                        $('#WallCover .photo-container').append('<img class="new-cover-photo lazy" data-src="' + data.imgUrl + '" />');
                        $('#WallCover .footer .actions').show();

                        $('#WallCover img.new-cover-photo').lazy({
                            bind: "event",
                            beforeLoad: function (element) {
                                element.removeClass("lazy");

                                $('#WallCover').removeClass('no-photo');
                                $('#WallCover .uploadProgress').show();
                                menuNoPhotoHidden();
                            },
                            afterLoad: function () {
                                $('#WallCover .uploadProgress').hide();

                                $('#WallCover .drag-message').show();
                                imageDrag();
                            }
                        });
                    } else {
                        alert(data.msg);
                        $('#WallCover .photo .actions .chooser').show();
                        $('#WallCover img.default-cover-photo').show();
                        $('#WallCover .uploadProgress').hide();
                        $('#WallCover .footer .user-info').removeClass('spc');
                    }

                    //Formu sıfırla
                    $('#WallCover form')[0].reset();
                }
            });
        }
    });

    $('#WallCover .footer .actions .cancel').on("click", function (e) {
        e.preventDefault();

        if ($('#WallCover').hasClass('isreposition')) {

            $('#WallCover img.new-cover-photo').draggable('destroy');
            $('#WallCover img.new-cover-photo').remove();

            $('#WallCover .footer .actions').hide();
            $('#WallCover .photo .actions .chooser').show();

            $('#WallCover img.default-cover-photo').show();
            $('#WallCover .uploadProgress').hide();
            $('#WallCover .footer .user-info').removeClass('spc');
            $('#WallCover .drag-message').hide();
            $('#WallCover').removeClass('isreposition')

        } else {
            $.ajax({
                url: '/Home/Delete',
                type: 'POST',
                data: { imgName: $('#WallCover img.new-cover-photo').attr('src') },
                cache: false,
                beforeSend: function () {
                    $('.uploadProgress').show()
                },
                success: function (data) {
                    $('#WallCover img.new-cover-photo').draggable('destroy');
                    $('#WallCover .footer .actions').hide();
                    $('#WallCover .photo .actions .chooser').show();
                    $('#WallCover img.new-cover-photo').remove();
                    $('#WallCover img.default-cover-photo').show();
                    $('#WallCover .uploadProgress').hide();
                    $('#WallCover .footer .user-info').removeClass('spc');
                    $('#WallCover .drag-message').hide();

                    var imgSrc = $('#WallCover img.default-cover-photo').attr('src');
                    if ((typeof imgSrc !== typeof undefined && imgSrc !== false) && imgSrc != "") {

                    } else {
                        $('#WallCover').addClass('no-photo');
                        menuNoPhotoHidden();
                    }
                }
            });
        }
    });

    $('#WallCover .footer .actions .save').on("click", function (e) {
        e.preventDefault();
        $.ajax({
            url: '/Home/Save',
            type: 'POST',
            data: { imgName: $('#WallCover img.new-cover-photo').attr('src'), top: $('#WallCover img.new-cover-photo').position().top },
            cache: false,
            beforeSend: function () {
                $('#WallCover .uploadProgress').show()
            },
            success: function (data) {
                if (data.status == true) {

                }
                var newImgName = $('#WallCover img.new-cover-photo').attr('src').substring($('#WallCover img.new-cover-photo').attr('src').lastIndexOf('/') + 1);
                newImgName = newImgName.substring(0, newImgName.lastIndexOf('.jpg')) + '.jpg';

                $('#WallCover .footer .actions').hide();
                $('#WallCover .photo .actions .chooser').show();
                $('#WallCover img.default-cover-photo').attr('src', '/images/c-' + newImgName + '?t=' + new Date().getTime());
                $('#WallCover img.default-cover-photo').show();
                $('#WallCover img.new-cover-photo').remove();
                $('#WallCover .footer .user-info').removeClass('spc');
                $('#WallCover .uploadProgress').hide();
                $('#WallCover .drag-message').hide();
            }
        });
    });


    $('#WallCover .photo .actions .delete').on("click", function (e) {
        e.preventDefault();
        if (!$('#WallCover').hasClass('no-photo')) {
            if (confirm('Kapak fotoğrafını kaldırmak istediğinizden emin misiniz?')) {

                $.ajax({
                    url: '/Home/CoverPhotoDelete',
                    type: 'POST',
                    cache: false,
                    beforeSend: function () {
                        $('#WallCover .uploadProgress').show()
                    },
                    success: function (data) {
                        $('#WallCover').addClass('no-photo');
                        menuNoPhotoHidden();
                        $('#WallCover .uploadProgress').hide();
                        $('#WallCover .sub-menu').hide();
                        $('#WallCover .photo .actions .chooser').removeClass('chooserhover');
                    }
                });
            }
        } else {
            alert('Önce fotoğraf yükleyiniz.');
        }
    });

    $('#WallCover .photo .actions .reposition').on("click", function (e) {
        e.preventDefault();

        if (!$('#WallCover').hasClass('no-photo')) {
            $('#WallCover .photo .actions .chooser').hide();
            $('#WallCover .sub-menu').hide();
            $('#WallCover').addClass('isreposition');

            var newImgName = $('#WallCover img.default-cover-photo').attr('src').substring($('#WallCover img.default-cover-photo').attr('src').lastIndexOf('/') + 3);

            $('#WallCover .photo-container').append('<img class="new-cover-photo lazy" data-src="/images/' + newImgName + '" />');

            $('#WallCover img.new-cover-photo').lazy({
                bind: "event",
                beforeLoad: function (element) {
                    element.removeClass("lazy");
                    $('#WallCover .footer .user-info').addClass('spc');
                    $('#WallCover .uploadProgress').show();
                },
                afterLoad: function () {
                    $('#WallCover img.default-cover-photo').hide();
                    $('#WallCover .footer .actions').show();
                    $('#WallCover .uploadProgress').hide();

                    $('#WallCover .drag-message').show();
                    imageDrag();
                }

            });
        } else {
            alert('Önce fotoğraf yükleyiniz.');
        }
    });

    function imageDrag() {
        var con = $('#WallCover .photo-container').height();
        var img = $('#WallCover .new-cover-photo').height();

        $('#WallCover img.new-cover-photo').draggable({
            scroll: false,
            axis: "y",
            cursor: "s-resize",
            drag: function (event, ui) {
                if (ui.position.top >= 0) {
                    ui.position.top = 0;
                }
                else if (ui.position.top <= con - img) {
                    ui.position.top = con - img;
                }
            }
        });
    }

    function menuNoPhotoHidden() {
        if ($('#WallCover').hasClass('no-photo')) {
            $('#WallCover .photo .actions .reposition').parent().hide();
            $('#WallCover .photo .actions .delete').parent().hide();
        } else {
            $('#WallCover .photo .actions .reposition').parent().show();
            $('#WallCover .photo .actions .delete').parent().show();
        }
    }

    $(document).on('click', function (e) {

        //Menu açıldıktan sonra eğer menü dışına basılırsa menüyü gizle
        if (!$(e.target).is('#WallCover .photo .actions *')) {
            $('#WallCover .photo .actions .chooser').removeClass('chooserhover');
            $('#WallCover .sub-menu').hide();
        }
    });
});