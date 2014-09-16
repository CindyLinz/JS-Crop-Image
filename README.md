JS-Crop-Image
=============

Interactive image crop region selector

[demo page](https://cindylinz.github.io/JS-Crop-Image/)

[complete demo page source](https://github.com/CindyLinz/JS-Crop-Image/blob/master/index.html)

# Synopsis

```html
<script src=crop-image.js></script>
<script>
  var target_image = document.getElementById('img');
  var crop_handle = crop_image(target_image, function(crop_region){
    // when the crop region changed, notify with crop_region
    console.log(crop_region.w + 'x' + crop_region.h + '+' + crop_region.x + '+' + crop_region.y);
  });

  crop_handle.set_crop({x: x, y: y, w: w, h: h});
    // Call this when you want to set the crop region explictly

  crop_handle.remove();
    // Call this when you want to remove the whole crop region
    // After this, the crop_handle is invalid.
    // You need to call crop_image again if you want to use the crop region selector once more.
</script>
```

# License
Copyright 2014, Cindy Wang (CindyLinz)
Licensed under the MIT license.

Date: 2014.9.17
