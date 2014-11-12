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
 *      rotateNum   // 旋转次数，顺时针: +1 逆时针: -1
 *      rotateSize  // 每次旋转度数，默认90
 * @dependencies
 *       1、jquery
 *       2、font-awesome  
 * TODO: 
 *     1、支持原图指定位置，上、下、左、右或者偏移量
 *     2、支持置顶旋转偏移量
 *     3、支持放大原图指定大小
 *     4、
 * @author hanrui01@baidu.com
 * @date 2014/03/21
 */
// define(
//     function(require) {
        // 插件的定义  
        $.fn.extend({
            rotateZoom: function(options) {
                var opts = $.extend({}, $.fn.rotateZoom.defaults, options);

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
                            rotateNum: 0
                        }
                    );
                    main();

                    /**
                     * 主函数入口
                     * @return {[type]} [description]
                     */
                    function main() {
                        init();
                        render();
                        addEvent();
                    }

                    /**
                     * 添加事件
                     */
                    function addEvent() {
                        // 鼠标滑过小图
                        me.bind('mousemove', function (event) {
                            var sourceEvent = window.event || event;
                            var smallImgOffset = curOptions.smallImg.offset();
                            var zoomHeight = curOptions.zoomHeight;
                            var zoomWidth = curOptions.zoomWidth;
                            var zoomTop = sourceEvent.clientY - smallImgOffset.top - zoomHeight / 2;
                            var zoomLeft = sourceEvent.clientX - smallImgOffset.left - zoomWidth / 2;
                            var smallImgHeight = curOptions.smallImg.innerHeight();
                            var smallImgWidth = curOptions.smallImg.innerWidth();
                            // 放大镜位置
                            var zoomDivTop = sourceEvent.clientY - smallImgOffset.top - smallImgHeight - zoomHeight / 2;
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
                            zoomDivTop = zoomDivTop < -smallImgHeight - 5 + rotateTopOffset
                                ? -smallImgHeight - 5 + rotateTopOffset 
                                : zoomDivTop; 
                            // 纵向下边界
                            zoomDivTop = zoomDivTop > -zoomHeight - 5 - rotateTopOffset
                                ? -zoomHeight - 5 - rotateTopOffset
                                : zoomDivTop;
                            
                            // 放大镜中心是鼠标
                            curOptions.zoomDiv.show().css({
                                // top: zoomDivTop,
                                top: zoomDivTop,
                                left: zoomDivLeft
                            });
                            // 图片
                            curOptions.zoomImg.css({
                                top: -zoomTop * heightBase - (heightBase - 1) * zoomHeight / 2 - rotateTopOffset * heightBase,
                                left: -zoomLeft * widthBase - (widthBase - 1) * zoomWidth / 2 - rotateLeftOffset * widthBase
                            });
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
                        curOptions.id = (new Date()).getTime();
                        curOptions.smallImg =  me.children('img');
                    }

                    /**
                     * 初始化控件
                     */
                    function render() {
                        zoomRender();
                        curOptions.zoomDiv = $('#zoom-div-' + curOptions.id); 
                        curOptions.zoomImg = $('#zoom-img-' + curOptions.id);
                        widgetRender();
                        curOptions.widthBase = curOptions.zoomImg.innerWidth() / curOptions.smallImg.innerWidth();
                        curOptions.heightBase = curOptions.zoomImg.innerHeight() / curOptions.smallImg.innerHeight();
                    }
                    /**
                     * 生成放大窗口元素
                     */
                    function zoomRender() {
                        var zoomDiv = $('<div>');
                        zoomDiv.attr('id', 'zoom-div-' + curOptions.id)
                            .css({
                                position: 'relative',
                                border: '1px red solid',
                                overflow: 'hidden',
                                width: curOptions.zoomWidth + 'px',
                                height: curOptions.zoomHeight + 'px',
                                marginTop: '0px'
                                // top: '-10000px',
                                // left: '-10000px'
                            });
                        var zoomImg = $('<img>')
                            .attr({
                                id: 'zoom-img-' + curOptions.id,
                                src: curOptions.originSrc
                            })
                            .css({
                                position: 'absolute'
                            });
                        zoomDiv.append(zoomImg);
                        me.append(zoomDiv);
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
                        var optDiv = $('<div>')
                            .css({
                                width: '70px',
                                margin: '0 auto',
                                position: 'absolute',
                                top: smallImgOffset.top + curOptions.smallImg.innerHeight() - 30,
                                left: smallImgOffset.left + curOptions.smallImg.innerWidth() / 2 - 35,
                            });
                        // 左 逆时针
                        // var rotateLeftIcon = $('<i class="fa fa-rotate-left"></i>')
                        var rotateLeftIcon = $('<input type="button" value="左">')
                            .on('mousemove', function (event) {
                                util.stopPropagation(event);
                            })
                            .on('click', function (event) {
                                curOptions.rotateNum -= 1;
                                rotateImg();
                                util.preventDefault(event);
                                util.stopPropagation(event);
                            });
                        // 右 顺时针
                        // var rotateRightIcon = $('<i class="fa fa-rotate-right"></i>')
                        var rotateRightIcon = $('<input type="button" value="右">')
                            .on('mousemove', function (event) {
                                util.stopPropagation(event);
                            })
                            .on('click', function () {
                                curOptions.rotateNum += 1;
                                rotateImg();
                                util.stopPropagation(event);
                            });
                        optDiv.append(rotateLeftIcon).append(rotateRightIcon);
                        $(document.body).append(optDiv);
                    }

                    /**
                     * 旋转图片
                     */
                    function rotateImg() {
                        curOptions.isToggle = !curOptions.isToggle;
                        rotate(curOptions.smallImg);
                        rotate(curOptions.zoomImg);
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
                });
            }
        });

        // 插件的defaults
        $.fn.rotateZoom.defaults = {
            // 放大窗口宽度
            zoomWidth: 80,
            // 放大窗口高度
            zoomHeight: 50,
            // 每次旋转度数
            rotateSize: 90
        };
//     }
// );