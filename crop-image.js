/*!
 * Javascript CropImage library v0.01
 * https://github.com/CindyLinz/JS-Crop-Image
 *
 * Copyright 2014, Cindy Wang (CindyLinz)
 * Licensed under the MIT license.
 *
 * Date: 2014.9.17
 */
function crop_image(target, ratio, notify_cb){
    var frame_dim = {}, target_dim = {}, key, rect;
    var crop_dim = null;

    if( typeof(ratio)==='function' ){
        notify_cb = ratio;
        ratio = undefined;
    }
    if( typeof(notify_cb)!=='function' )
        notify_cb = new Function('');

    var on, off;
    if( target.addEventListener ){
        on = function(target, name, cb){
            return target.addEventListener(name, cb, false);
        };
        off = function(target, name, cb){
            return target.removeEventListener(name, cb, false);
        };
    }
    else{
        on = function(target, name, cb){
            return target.attachEvent('on'+name, cb);
        };
        off = function(target, name, cb){
            return target.detachEvent('on'+name, cb);
        };
    }
    var raf, craf;
    raf = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function(cb){ return window.setTimeout(cb, 100) };
    craf = window.cancelAnimationFrame || window.mozCancelAnimationFrame || window.webkitCancelAnimationFrame || window.msCancelAnimationFrame || window.clearTimeout;

    rect = target.getBoundingClientRect();
    frame_dim.x = rect.left;
    frame_dim.y = rect.top;
    frame_dim.w = rect.width;
    frame_dim.h = rect.height;
    if( window.getComputedStyle ){
        frame_dim.z = window.getComputedStyle(target, null).getPropertyValue('z-index');
        target_dim.w = frame_dim.w
            - window.parseFloat(window.getComputedStyle(target, null).getPropertyValue('padding-left').replace(/[^.\d]/g, ''), 10)
            - window.parseFloat(window.getComputedStyle(target, null).getPropertyValue('padding-right').replace(/[^.\d]/g, ''), 10);
        target_dim.h = frame_dim.h
            - window.parseFloat(window.getComputedStyle(target, null).getPropertyValue('padding-top').replace(/[^.\d]/g, ''), 10)
            - window.parseFloat(window.getComputedStyle(target, null).getPropertyValue('padding-bottom').replace(/[^.\d]/g, ''), 10);
        target_dim.x = frame_dim.x
            + window.parseFloat(window.getComputedStyle(target, null).getPropertyValue('padding-left').replace(/[^.\d]/g, ''), 10);
        target_dim.y = frame_dim.y
            + window.parseFloat(window.getComputedStyle(target, null).getPropertyValue('padding-top').replace(/[^.\d]/g, ''), 10);
    }
    else if( target.currentStyle ){
        frame_dim.z = target.currentStyle.zIndex;
        target_dim.w = frame_dim.w - target.currentStyle.paddingLeft - target.currentStyle.paddingRight;
        target_dim.h = frame_dim.h - target.currentStyle.paddingTop - target.currentStyle.paddingBottom;
        target_dim.x = frame_dim.x + target.currentStyle.paddingLeft;
        target_dim.y = frame_dim.y + target.currentStyle.paddingTop;
    }
    else{
        target_dim.w = frame_dim.w;
        target_dim.h = frame_dim.h;
        target_dim.x = frame_dim.x;
        target_dim.y = frame_dim.y;
    }
    if( !parseFloat(frame_dim.z) )
        frame_dim.z = 0;

    var create_pad;
    var lt_mousedown, rt_mousedown, lb_mousedown, rb_mousedown, l_mousedown, t_mousedown, r_mousedown, b_mousedown;
    var lt_holder, rt_holder, lb_holder, rb_holder, l_holder, t_holder, r_holder, b_holder;
    var body_mousedown;
    var body_pad;

    create_pad = document.createElement('div');
    create_pad.style.position = 'absolute';
    create_pad.style.left = target_dim.x + 'px';
    create_pad.style.top = target_dim.y + 'px';
    create_pad.style.width = target_dim.w + 'px';
    create_pad.style.height = target_dim.h + 'px';
    create_pad.style.zIndex = frame_dim.z + 1;
    create_pad.style.backgroundColor = '#000';
    create_pad.style.filter = 'alpha(opacity=1)';
    create_pad.style.opacity = 0.01;
    create_pad.style.cursor = 'crosshair';
    document.body.appendChild(create_pad);

    var dim_assign = function(target, x, y, w, h){
        target.style.left = x + 'px';
        target.style.top = y + 'px';
        target.style.width = w + 'px';
        target.style.height = h + 'px';
    };

    var pos_assign = function(target, x, y){
        target.style.left = x + 'px';
        target.style.top = y + 'px';
    };

    var draw_crop = function(){
        pos_assign(lt_holder, target_dim.x + crop_dim.x - 5, target_dim.y + crop_dim.y - 5);
        pos_assign(rt_holder, target_dim.x + crop_dim.x + crop_dim.w - 5, target_dim.y + crop_dim.y - 5);
        pos_assign(lb_holder, target_dim.x + crop_dim.x - 5, target_dim.y + crop_dim.y + crop_dim.h - 5);
        pos_assign(rb_holder, target_dim.x + crop_dim.x + crop_dim.w - 5, target_dim.y + crop_dim.y + crop_dim.h - 5);

        pos_assign(l_holder, target_dim.x + crop_dim.x - 5, target_dim.y + crop_dim.y + crop_dim.h/2 - 5);
        pos_assign(t_holder, target_dim.x + crop_dim.x + crop_dim.w/2 - 5, target_dim.y + crop_dim.y - 5);
        pos_assign(r_holder, target_dim.x + crop_dim.x + crop_dim.w - 5, target_dim.y + crop_dim.y + crop_dim.h/2 - 5);
        pos_assign(b_holder, target_dim.x + crop_dim.x + crop_dim.w/2 - 5, target_dim.y + crop_dim.y + crop_dim.h - 5);

        body_pad.style.clip = 'rect(' + crop_dim.y + 'px,' + (crop_dim.x + crop_dim.w) + 'px,' + (crop_dim.y + crop_dim.h) + 'px,' + crop_dim.x + 'px)';
    };

    var onmousedown, onmouseup, onresize_all, onresize_h, onresize_v, onmove;
    var mouse_anchor;
    var changed = false;

    var keep_draw_crop = function(){
        if( changed ){
            changed = false;
            draw_crop();
            notify_cb(crop_dim);
        }
        raf(keep_draw_crop);
    };
    var stop_draw_crop = function(){
        craf(keep_draw_crop);
    };

    var create_crop = function(dim){
        crop_dim = dim;
        off(create_pad, 'mousedown', onmousedown);
        create_pad.style.filter = 'alpha(50)';
        create_pad.style.opacity = 0.5;
        create_pad.style.cursor = 'default';

        var holder_init = function(cursor, onmousedown){
            var holder = document.createElement('div');
            holder.style.position = 'absolute';
            holder.style.zIndex = frame_dim.z + 3;
            holder.style.width = '10px';
            holder.style.height = '10px';
            holder.style.filter = 'alpha(opacity=50)';
            holder.style.opacity = 0.5;
            holder.style.backgroundColor = '#fff';
            holder.style.cursor = cursor;
            on(holder, 'mousedown', onmousedown);
            document.body.appendChild(holder);
            return holder;
        };
        lt_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: target_dim.x + crop_dim.x + crop_dim.w, y: target_dim.y + crop_dim.y + crop_dim.h };
            on(document.body, 'mousemove', onresize_all);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        lt_holder = holder_init('nw-resize', lt_mousedown);
        rt_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: target_dim.x + crop_dim.x, y: target_dim.y + crop_dim.y + crop_dim.h };
            on(document.body, 'mousemove', onresize_all);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        rt_holder = holder_init('ne-resize', rt_mousedown);
        lb_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: target_dim.x + crop_dim.x + crop_dim.w, y: target_dim.y + crop_dim.y };
            on(document.body, 'mousemove', onresize_all);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        lb_holder = holder_init('sw-resize', lb_mousedown);
        rb_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: target_dim.x + crop_dim.x, y: target_dim.y + crop_dim.y };
            on(document.body, 'mousemove', onresize_all);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        rb_holder = holder_init('se-resize', rb_mousedown);

        l_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: target_dim.x + crop_dim.x + crop_dim.w, y: target_dim.y + crop_dim.y + crop_dim.h/2 };
            on(document.body, 'mousemove', onresize_h);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        l_holder = holder_init('w-resize', l_mousedown);
        t_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: target_dim.x + crop_dim.x + crop_dim.w/2, y: target_dim.y + crop_dim.y + crop_dim.h };
            on(document.body, 'mousemove', onresize_v);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        t_holder = holder_init('n-resize', t_mousedown);
        r_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: target_dim.x + crop_dim.x, y: target_dim.y + crop_dim.y + crop_dim.h/2 };
            on(document.body, 'mousemove', onresize_h);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        r_holder = holder_init('e-resize', r_mousedown);
        b_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: target_dim.x + crop_dim.x + crop_dim.w/2, y: target_dim.y + crop_dim.y };
            on(document.body, 'mousemove', onresize_v);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        b_holder = holder_init('s-resize', b_mousedown);

        body_mousedown = function(ev){
            if( ev.preventDefault ) ev.preventDefault();
            mouse_anchor = { x: ev.clientX - target_dim.x - crop_dim.x, y: ev.clientY - target_dim.y - crop_dim.y };
            on(document.body, 'mousemove', onmove);
            on(document.body, 'mouseup', onmouseup);
            keep_draw_crop();
            return false;
        };
        body_pad = target.cloneNode();
        body_pad.id = '';
        body_pad.style.position = 'absolute';
        body_pad.style.zIndex = frame_dim.z + 2;
        body_pad.style.cursor = 'move';
        body_pad.style.padding = '0px';
        body_pad.style.margine = '0px';
        body_pad.style.left = target_dim.x + 'px';
        body_pad.style.top = target_dim.y + 'px';
        body_pad.setAttribute('unselectable', 'on');
        body_pad.style.userSelect = 'none';
        body_pad.style.MozUserSelect = '-moz-none';
        body_pad.style.KhtmlUserSelect = 'none';
        body_pad.style.WebkitUserSelect = 'none';
        body_pad.style.MsUserSelect = 'none';
        body_pad.style.OUserSelect = 'none';
        on(body_pad, 'mousedown', body_mousedown);
        document.body.appendChild(body_pad);
    };

    onmousedown = function(ev){
        if( ev.preventDefault ) ev.preventDefault();
        on(document.body, 'mouseup', onmouseup);
        on(document.body, 'mousemove', onmousemove);

        create_crop({
            x: ev.clientX - target_dim.x,
            y: ev.clientY - target_dim.y,
            w: 0,
            h: 0
        });

        mouse_anchor = { x: ev.clientX, y: ev.clientY };
        on(document.body, 'mousemove', onresize_all);
        on(document.body, 'mouseup', onmouseup);
        changed = true;
        keep_draw_crop();
        return false;
    };
    onmouseup = function(ev){
        off(document.body, 'mouseup', onmouseup);
        off(document.body, 'mousemove', onresize_all);
        off(document.body, 'mousemove', onresize_h);
        off(document.body, 'mousemove', onresize_v);
        off(document.body, 'mousemove', onmove);
        stop_draw_crop();
    };
    onresize_all = function(ev){
        var dx, dy, r, th, dw, dh, d;
        if( ratio ){
            changed = true;

            th = Math.atan(ratio);
            dx = ev.clientX - mouse_anchor.x;
            dy = ev.clientY - mouse_anchor.y;
            r = Math.max(Math.abs(dx/Math.cos(th)), Math.abs(dy/Math.sin(th)));

            crop_dim.w = r * Math.cos(th);
            crop_dim.h = r * Math.sin(th);
            if( ev.clientX < mouse_anchor.x )
                crop_dim.x = mouse_anchor.x - target_dim.x - crop_dim.w;
            else
                crop_dim.x = mouse_anchor.x - target_dim.x;
            if( ev.clientY < mouse_anchor.y )
                crop_dim.y = mouse_anchor.y - target_dim.y - crop_dim.h;
            else
                crop_dim.y = mouse_anchor.y - target_dim.y;

            dw = dh = 0;
            if( crop_dim.x < 0 ){
                d = crop_dim.x;
                dw += d;
            }
            if( crop_dim.x + crop_dim.w > target_dim.w ){
                d = crop_dim.x + crop_dim.w - target_dim.w;
                dw -= d;
            }
            if( crop_dim.y < 0 ){
                d = crop_dim.y;
                dh += d;
            }
            if( crop_dim.y + crop_dim.h > target_dim.h ){
                d = crop_dim.y + crop_dim.h - target_dim.h;
                dh -= d;
            }
            if( dw * ratio < dh )
                dh = dw * ratio;
            else
                dw = dh / ratio;
            if( dw ){
                if( ev.clientX < mouse_anchor.x )
                    crop_dim.x -= dw;
                crop_dim.w += dw;
            }
            if( dh ){
                if( ev.clientY < mouse_anchor.y )
                    crop_dim.y -= dh;
                crop_dim.h += dh;
            }
        }
        else{
            onresize_h(ev);
            onresize_v(ev);
        }
    };
    onresize_h = function(ev){
        changed = true;
        if( ev.clientX < mouse_anchor.x ){
            crop_dim.x = ev.clientX - target_dim.x;
            crop_dim.w = mouse_anchor.x - ev.clientX;
        }
        else{
            crop_dim.x = mouse_anchor.x - target_dim.x;
            crop_dim.w = ev.clientX - mouse_anchor.x;
        }
        if( crop_dim.x < 0 ){
            crop_dim.w += crop_dim.x;
            crop_dim.x = 0;
        }
        else if( crop_dim.x > target_dim.w )
            crop_dim.x = target_dim.w;
        if( crop_dim.w < 0 )
            crop_dim.w = 0;
        else if( crop_dim.x + crop_dim.w > target_dim.w )
            crop_dim.w = target_dim.w - crop_dim.x;
        if( ratio ){
            var dw, dy;
            crop_dim.h = crop_dim.w * ratio;
            crop_dim.y = mouse_anchor.y - target_dim.y - crop_dim.h/2;
            dy = 0;
            if( crop_dim.y < 0 )
                dy -= crop_dim.y;
            if( crop_dim.y + crop_dim.h > target_dim.h )
                dy -= target_dim.h - (crop_dim.y + crop_dim.h);
            dw = -dy * 2 / ratio;
            crop_dim.w += dw;
            if( ev.clientX < mouse_anchor.x )
                crop_dim.x -= dw;
            crop_dim.h -= dy * 2;
            crop_dim.y += dy;
        }
    };
    onresize_v = function(ev){
        changed = true;
        if( ev.clientY < mouse_anchor.y ){
            crop_dim.y = ev.clientY - target_dim.y;
            crop_dim.h = mouse_anchor.y - ev.clientY;
        }
        else{
            crop_dim.y = mouse_anchor.y - target_dim.y;
            crop_dim.h = ev.clientY - mouse_anchor.y;
        }
        if( crop_dim.y < 0 ){
            crop_dim.h += crop_dim.y;
            crop_dim.y = 0;
        }
        else if( crop_dim.y > target_dim.h )
            crop_dim.y = target_dim.h;
        if( crop_dim.y < 0 )
            crop_dim.y = 0;
        else if( crop_dim.y + crop_dim.h > target_dim.h )
            crop_dim.h = target_dim.h - crop_dim.y;
        if( ratio ){
            var dh, dx;
            crop_dim.w = crop_dim.h / ratio;
            crop_dim.x = mouse_anchor.x - target_dim.x - crop_dim.w/2;
            dx = 0;
            if( crop_dim.x < 0 )
                dx -= crop_dim.x;
            if( crop_dim.x + crop_dim.w > target_dim.w )
                dx -= target_dim.w - (crop_dim.x + crop_dim.w);
            dh = -dx * 2 * ratio;
            crop_dim.h += dh;
            if( ev.clientY < mouse_anchor.y )
                crop_dim.y -= dh;
            crop_dim.w -= dx * 2;
            crop_dim.x += dx;
        }
    };
    onmove = function(ev){
        changed = true;
        crop_dim.x = ev.clientX - target_dim.x - mouse_anchor.x;
        crop_dim.y = ev.clientY - target_dim.y - mouse_anchor.y;
        if( crop_dim.x < 0 )
            crop_dim.x = 0;
        else if( crop_dim.x + crop_dim.w > target_dim.w )
            crop_dim.x = target_dim.w - crop_dim.w;
        if( crop_dim.y < 0 )
            crop_dim.y = 0;
        else if( crop_dim.y + crop_dim.h > target_dim.h )
            crop_dim.y = target_dim.h - crop_dim.h;
    };
    on(create_pad, 'mousedown', onmousedown);

    return {
        remove: function(){
            stop_draw_crop();

            if( create_pad ){
                off(create_pad, 'mousedown', onmousedown);
                document.body.removeChild(create_pad);
            }
            if( lt_holder ){
                off(lt_holder, lt_mousedown);
                document.body.removeChild(lt_holder);
            }
            if( rt_holder ){
                off(rt_holder, rt_mousedown);
                document.body.removeChild(rt_holder);
            }
            if( lb_holder ){
                off(lb_holder, lb_mousedown);
                document.body.removeChild(lb_holder);
            }
            if( rb_holder ){
                off(rb_holder, rb_mousedown);
                document.body.removeChild(rb_holder);
            }
            if( l_holder ){
                off(l_holder, l_mousedown);
                document.body.removeChild(l_holder);
            }
            if( t_holder ){
                off(t_holder, t_mousedown);
                document.body.removeChild(t_holder);
            }
            if( r_holder ){
                off(r_holder, r_mousedown);
                document.body.removeChild(r_holder);
            }
            if( b_holder ){
                off(b_holder, b_mousedown);
                document.body.removeChild(b_holder);
            }
            if( body_pad ){
                off(body_pad, body_mousedown);
                document.body.removeChild(body_pad);
            }
            off(document.body, 'mouseup', onmouseup);
            off(document.body, 'mousemove', onresize_all);
            off(document.body, 'mousemove', onresize_h);
            off(document.body, 'mousemove', onresize_v);
            off(document.body, 'mousemove', onmove);
        },
        set_crop: function(dim){
            var dim2 = {
                x: window.parseFloat(dim.x, 10),
                y: window.parseFloat(dim.y, 10),
                w: window.parseFloat(dim.w, 10),
                h: window.parseFloat(dim.h, 10)
            };
            if( !dim2.x ) dim2.x = 0;
            if( !dim2.y ) dim2.y = 0;
            if( !dim2.w ) dim2.w = 0;
            if( !dim2.h ) dim2.h = 0;
            if( dim2.x < 0 ){
                dim2.w += dim2.x;
                dim2.x = 0;
            }
            else if( dim2.x > target_dim.w )
                dim2.x = target_dim.w;
            if( dim2.w < 0 )
                dim2.w = 0;
            else if( dim2.x + dim2.w > target_dim.w )
                dim2.w = target_dim.w - dim2.x;
            if( dim2.y < 0 ){
                dim2.h += dim2.y;
                dim2.y = 0;
            }
            else if( dim2.y > target_dim.h )
                dim2.y = target_dim.h;
            if( dim2.h < 0 )
                dim2.h = 0;
            else if( dim2.y + dim2.h > target_dim.h )
                dim2.h = target_dim.h - dim2.y;

            if( crop_dim )
                crop_dim = dim2;
            else
                create_crop(dim2);
            draw_crop();
        }
    };
}
