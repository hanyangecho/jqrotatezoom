/**
 * @file 放大镜 + 旋转
 *       1、鼠标滑过，在滑过位置显示对应原图；
 *       2、大小图一起旋转；
 *       3、旋转目前只支持90；
 * @options各属性说明，每个$对象一个options
 *      zoomWidth   // 放大窗口宽度
 *      zoomHeight  // 放大窗口高度
 *      id          // 每个$对象唯一id
 *      originSrc   // 原图片地址
 *      smallImg    // 小图片
 *      widthBase   // 宽度基数
 *      heightBase  // 高度基数
 *      isToggle    // true: 高度和宽度基数互换，false: 不换
 *      isToggleReverse  // true:纵向反转，false: 不反转
 *      rotateNum   // 旋转次数，顺时针: +1 逆时针: -1
 *      rotateSize  // 每次旋转度数，默认90
 *      isExist     // 是否已存在，默认false
 *      rotateZoomDiv // 最外层div
 *      结构如下：
 *          <div class="jq-rotate-zoom">
 *              <img class="jq-zoom-small-img"/>
 *              <div class="jq-zoom">
 *                  <label class="loadingText">图片加载中...</label>
 *                  <img class="jq-zoom-big-img"/>
 *              </div>
 *              <div class="jq-rotate-icon">
 *                  
 *              </div>
 *          </div>
 * @dependencies
 *       1、jquery
 *       2、font-awesome  
 * TODO: 
 *     1、支持原图指定位置，上、下、左、右或者偏移量
 *     2、支持置顶旋转偏移量
 *     3、支持放大原图指定大小
 *     4、
 * @author hanrui@baijiahulian.com
 * @date 2014/11/12
 */
define(
    function(require) {
        // 插件的定义  
        $.fn.extend({
            jqrotatezoom: function(options) {
                var opts = $.extend({}, $.fn.jqrotatezoom.defaults, options);

                var util = {
                    /**
                     * 停止事件的传播
                     * 
                     * @param {Event} event 事件对象
                     */
                    stopPropagation: function (event) {
                       if (event.stopPropagation) {
                           event.stopPropagation();
                       } else {
                           event.cancelBubble = true;
                       }
                    },
                    preventDefault: function (event) {
                        //如果提供了事件对象，则这是一个非IE浏览器 
                        if ( event && event.preventDefault ) 
                        //阻止默认浏览器动作(W3C) 
                        event.preventDefault(); 
                        else
                        //IE中阻止函数器默认动作的方式 
                        window.event.returnValue = false; 
                        return false;
                    }
                };

                //在当前实例中循环   reutrn 作用:保证可拿到 jQuery对象
                return this.each(function() {
                    var me = $(this);
                    var curOptions = $.extend(
                        {}, opts, 
                        { 
                            isToggle: false,
                            rotateNum: 0,
                            isToggleReverse: false
                        }
                    );
                    main();

                    /**
                     * 主函数入口
                     * @return {[type]} [description]
                     */
                    function main() {
                        init();
                        // curOptions.rotateNum = 0;
                        rotate(curOptions.smallImg);
                        // render();
                        // addEvent();
                    }

                    /**
                     * 添加事件
                     */
                    function addEvent() {
                        // 鼠标滑过小图
                        me.off('mousemove');
                        me.bind('mousemove', function (event) {
                            var sourceEvent = window.event || event;
                            var smallImgOffset = curOptions.smallImg.offset();
                            var zoomHeight = curOptions.zoomHeight;
                            var zoomWidth = curOptions.zoomWidth;
                            var zoomTop = sourceEvent.clientY + document.body.scrollTop - smallImgOffset.top - zoomHeight / 2;
                            var zoomLeft = sourceEvent.clientX + document.body.scrollLeft - smallImgOffset.left - zoomWidth / 2;
                            var smallImgHeight = curOptions.smallImg.innerHeight();
                            var smallImgWidth = curOptions.smallImg.innerWidth();
                            // 放大镜位置
                            var zoomDivTop = sourceEvent.clientY + document.body.scrollTop - smallImgOffset.top - smallImgHeight - zoomHeight / 2;
                            var zoomDivLeft = zoomLeft;
                            // 基数
                            var heightBase = (curOptions.isToggle ? curOptions.widthBase : curOptions.heightBase);
                            var widthBase = (curOptions.isToggle ? curOptions.heightBase : curOptions.widthBase);
                            // 偏移量，旋转中心点不变，高宽不相等
                            var rotateLeftOffset = 0;
                            var rotateTopOffset = 0;
                            if (curOptions.isToggle && smallImgWidth !== smallImgHeight) {
                                // left偏移量
                                rotateLeftOffset = (smallImgWidth - smallImgHeight) / 2; 
                                // top偏移量
                                rotateTopOffset = (smallImgHeight - smallImgWidth) / 2; 
                                zoomDivTop += rotateTopOffset;
                                zoomDivLeft += rotateLeftOffset;
                                var temp = smallImgWidth;
                                smallImgWidth = smallImgHeight;
                                smallImgHeight = smallImgWidth;
                            }
                            // 避免越界
                            // 横向左边界
                            zoomDivLeft = zoomDivLeft < rotateLeftOffset
                                ? rotateLeftOffset
                                : zoomDivLeft;
                            // 横向右边界，考虑旋转
                            var rightMaxLeft = smallImgWidth - zoomWidth + rotateLeftOffset;
                            zoomDivLeft = zoomDivLeft > rightMaxLeft
                                ? rightMaxLeft
                                : zoomDivLeft;
                            // 纵向上边界
                            // TODO: -5为zoomDiv和smallImg之间margin-top差值
                            zoomDivTop = zoomDivTop < -smallImgHeight + rotateTopOffset
                                ? -smallImgHeight + rotateTopOffset 
                                : zoomDivTop; 
                            // 纵向下边界
                            zoomDivTop = zoomDivTop > -zoomHeight - rotateTopOffset
                                ? -zoomHeight - rotateTopOffset
                                : zoomDivTop;
                            
                            // 放大镜中心是鼠标
                            curOptions.zoomDiv.show().css({
                                // top: zoomDivTop,
                                top: zoomDivTop,
                                left: zoomDivLeft
                            });

                            if (curOptions.isLoadedBigImg) {
                                // 图片
                                curOptions.zoomImg.show();
                                curOptions.zoomDiv.children('.loadingText').hide();
                                curOptions.zoomImg.css({
                                    top: -zoomTop * heightBase - (heightBase - 1) * zoomHeight / 2 - rotateTopOffset * heightBase,
                                    left: -zoomLeft * widthBase - (widthBase - 1) * zoomWidth / 2 - rotateLeftOffset * widthBase
                                });
                            } else {
                                curOptions.zoomImg.hide();
                                curOptions.zoomDiv.children('.loadingText').show();
                            }
                        });
                        me.on('mouseleave mouseout', function (event) {
                            curOptions.zoomDiv.hide();
                        });
                    }

                    /**
                     * 初始化操作
                     * @return {[type]} [description]
                     */
                    function init() {
                        curOptions.originSrc = me.attr('href');
                        if (me.children('.jq-rotate-zoom').length > 0) {
                            curOptions.isExist = true;
                            curOptions.rotateZoomDiv = me.children('.jq-rotate-zoom'); 
                            curOptions.zoomDiv = curOptions.rotateZoomDiv.children('.jq-zoom'); 
                            curOptions.zoomImg = curOptions.zoomDiv.children('img');
                            curOptions.smallImg =  curOptions.rotateZoomDiv.children('.jq-zoom-small-img');
                        } else {
                            curOptions.smallImg =  me.children('img');
                            curOptions.smallImg.addClass('jq-zoom-small-img');
                        }
                        if (curOptions.smallImg[0].complete) {
                            render();
                            addEvent();
                        } else {
                            curOptions.smallImg.off('load');
                            curOptions.smallImg.on('load', function (event) {
                                render();
                                addEvent();
                                curOptions.smallImg.off('load');
                            });
                        }
                    }

                    /**
                     * 初始化控件
                     */
                    function render() {
                        zoomRender();
                        if (!curOptions.isExist) {
                            curOptions.rotateZoomDiv = me.children('.jq-rotate-zoom'); 
                            curOptions.zoomDiv = curOptions.rotateZoomDiv.children('.jq-zoom'); 
                            curOptions.zoomImg = curOptions.zoomDiv.children('img');
                        }
                        widgetRender();
                    }
                    /**
                     * 生成放大窗口元素
                     */
                    function zoomRender() {
                        var zoomDiv;
                        if (curOptions.isExist) {
                            zoomDiv = curOptions.zoomDiv;
                        } else {
                            zoomDiv = $('<div>')
                            .addClass('jq-zoom')
                            .css({
                                position: 'relative',
                                border: '1px #c9c9c9 solid',
                                overflow: 'hidden',
                                top: '-10000px',
                                left: '-10000px',
                                textAlign: 'center'
                            });
                        }
                        zoomDiv.css({
                            lineHeight: curOptions.zoomHeight + 'px',
                            width: curOptions.zoomWidth + 'px',
                            height: curOptions.zoomHeight + 'px'
                        });
                        var zoomImg;
                        if (curOptions.isExist) {
                            zoomImg = curOptions.zoomImg;
                            zoomImg.attr('src', curOptions.originSrc);
                        } else {
                            zoomImg = $('<img>')
                            .attr({
                                src: curOptions.originSrc
                            })
                            .css({
                                position: 'absolute'
                            })
                            .addClass('jq-zoom-big-img');
                            
                            zoomDiv.append(zoomImg).append('<label class="loadingText" style="display:none;">图片加载中...</label>');
                            me.append(zoomDiv);
                        }
                        zoomImg.off('load');
                        zoomImg.on('load', function () {
                            curOptions.isLoadedBigImg = true;
                            // 考虑offsetHeight=0的场景，可能是dom没有加载成功，只是img已loaded
                            var zoomImgWidth = curOptions.zoomImg.innerWidth() || curOptions.zoomImg[0].width;
                            var zoomImgHeight = curOptions.zoomImg.innerHeight() || curOptions.zoomImg[0].height;
                            curOptions.widthBase = zoomImgWidth / curOptions.smallImg.innerWidth();
                            curOptions.heightBase = zoomImgHeight / curOptions.smallImg.innerHeight();
                            zoomImg.off('load');
                        });

                        // 图片居中
                        var div;
                        if (curOptions.isExist) {
                            div = curOptions.rotateZoomDiv;
                        } else {
                            me.parent().css('position', 'relative');
                            div = $('<div>')
                                .addClass('jq-rotate-zoom')
                                .css({
                                    // overflow: 'hidden',
                                    margin: '0 auto',
                                    position: 'absolute'
                                });
                            div.append(me.children());
                            me.append(div);
                        }
                        var smallImgHeight = curOptions.smallImg.outerHeight();
                        div.css({
                            // overflow: 'hidden',
                            height: smallImgHeight,
                            width: curOptions.smallImg.outerWidth(),
                            top: curOptions.parentNodeHeight / 2,
                            marginTop: -smallImgHeight / 2,
                            left: curOptions.parentNodeWidth / 2,
                            marginLeft: - curOptions.smallImg.outerWidth() / 2
                        });
                    }

                    // 向左旋转
                    function rotateLeft(event) {
                        curOptions.rotateNum -= 1;
                        rotateImg();
                    }

                    // 向右旋转
                    function rotateRight(event) {
                        curOptions.rotateNum += 1;
                        rotateImg();
                    }

                    /**
                     * 初始化控件
                     *     1、旋转
                     * TODO:
                     *     1、按比例放大原图
                     * @return {[type]} [description]
                     */
                    function widgetRender() {
                        var smallImgOffset = curOptions.smallImg.offset();
                        var smallImgHeight = curOptions.smallImg.outerHeight();
                        var optDiv;
                        if (curOptions.isExist) {
                            optDiv = me.children('.jq-rotate-icon');
                            optDiv.css({
                                top: curOptions.parentNodeHeight / 2 - smallImgHeight / 2 - 30,
                                left: curOptions.parentNodeWidth / 2 - 40
                            });
                            optDiv.children('.jq-rotate-left-btn').off('click').on('click', rotateLeft);
                            optDiv.children('.jq-rotate-right-btn').off('click').on('click', rotateRight);
                            optDiv.children('.jq-rotate-y-btn').off('click').on('click', rotateYImg);
                            return;
                        }
                        
                        optDiv = $('<div>')
                            .css({
                                width: '90px',
                                margin: '0 auto',
                                position: 'absolute',
                                top: curOptions.parentNodeHeight / 2 - smallImgHeight / 2 - 30,
                                left: curOptions.parentNodeWidth / 2 - 40
                            })
                            .addClass('jq-rotate-icon');
                        // 左 逆时针
                        var rotateLeftIcon = $('<i class="fa fa-rotate-left"></i>')
                        // var rotateLeftIcon = $('<input type="button" value="左转">')
                            .addClass('jq-rotate-left-btn')
                            .css({
                                fontSize: '2em',
                                color: '#fff',
                                textShadow: '1px 1px 1px #474747'
                            })
                            .on('mousemove', function (event) {
                                util.stopPropagation(event);
                            })
                            .on('click', rotateLeft);
                        // 右 顺时针
                        var rotateRightIcon = $('<i class="fa fa-rotate-right"></i>')
                        // var rotateRightIcon = $('<input type="button" value="右转">')
                            .addClass('jq-rotate-right-btn')
                            .css({
                                marginLeft: '6px',
                                fontSize: '2em',
                                color: '#fff',
                                textShadow: '1px 1px 1px #474747'
                            })
                            .on('mousemove', function (event) {
                                util.stopPropagation(event);
                            })
                            .on('click', rotateRight);
                        // 纵向反转
                        var rotateYIcon = $('<i class="fa fa-exchange"></i>')
                        // var rotateRightIcon = $('<input type="button" value="右转">')
                            .addClass('jq-rotate-y-btn')
                            .css({
                                marginLeft: '6px',
                                fontSize: '2em',
                                color: '#fff',
                                textShadow: '1px 1px 1px #474747'
                            })
                            .on('mousemove', function (event) {
                                util.stopPropagation(event);
                            })
                            .on('click', rotateYImg);
                        optDiv.append(rotateLeftIcon).append(rotateRightIcon).append(rotateYIcon);
                        me.append(optDiv);
                    }

                    /**
                     * 旋转图片
                     */
                    function rotateImg() {
                        curOptions.isToggle = !curOptions.isToggle;
                        rotate(curOptions.smallImg);
                        rotate(curOptions.zoomImg);
                        util.preventDefault(event);
                        util.stopPropagation(event);
                    }

                    /**
                     * 纵向反转图片
                     */
                    function rotateYImg() {
                        curOptions.isToggleReverse = !curOptions.isToggleReverse;
                        rotateY(curOptions.smallImg);
                        rotateY(curOptions.zoomImg);
                        util.preventDefault(event);
                        util.stopPropagation(event);
                    }


                    /**
                     * 旋转
                     * @param  {Object} source dom对象
                     */
                    function rotate(source) {
                        var count = curOptions.rotateSize * curOptions.rotateNum;
                        source.css({
                            transform: 'rotate(' + count + 'deg)',
                            '-ms-transform': 'rotate(' + count + 'deg)', /* IE 9 */
                            '-moz-transform': 'rotate(' + count + 'deg)', /* Firefox */
                            '-webkit-transform': 'rotate(' + count + 'deg)', /* Safari and Chrome */
                            '-o-transform': 'rotate(' + count + 'deg)' /* Opera */
                        });
                    }

                    /**
                     * 旋转
                     * @param  {Object} source dom对象
                     */
                    function rotateY(source) {
                        var count = curOptions.isToggleReverse ? 180 : 0;
                        source.css({
                            transform: 'rotateY(' + count + 'deg)',
                            '-ms-transform': 'rotateY(' + count + 'deg)', /* IE 9 */
                            '-moz-transform': 'rotateY(' + count + 'deg)', /* Firefox */
                            '-webkit-transform': 'rotateY(' + count + 'deg)', /* Safari and Chrome */
                            '-o-transform': 'rotateY(' + count + 'deg)' /* Opera */
                        });
                    }

                    /**
                     * 初始化图片，去掉旋转
                     * @param  {Object} source dom对象
                     */
                    function initRotate(source) {
                        source.css({
                            transform: 'rotate(0deg)',
                            '-ms-transform': 'rotate(0deg)', /* IE 9 */
                            '-moz-transform': 'rotate(0deg)', /* Firefox */
                            '-webkit-transform': 'rotate(0deg)', /* Safari and Chrome */
                            '-o-transform': 'rotate(0deg)' /* Opera */
                        });
                    }
                });
            }
        });

        // 插件的defaults
        $.fn.jqrotatezoom.defaults = {
            // 放大窗口宽度
            zoomWidth: 80,
            // 放大窗口高度
            zoomHeight: 50,
            // 每次旋转度数
            rotateSize: 90,
            // TODO: 去掉下面两个属性
            // 父节点高度，做图片居中处理
            parentNodeHeight: 358,
            // 父节点宽度，做图片居中处理
            parentNodeWidth: 358
        };
    }
);