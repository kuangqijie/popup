/*
 * @description: 弹窗插件
 * @scope: 全局
 * @author: kuangqj
 * @create: 2015/4/14 18:00
 * @update: 2015/4/14 18:00
*/

//弹出层
(function($){
	$.popup = function(options){
		var o = $.extend({
			id:"j-popup-id",			//id 如页面需同时存在两个以上弹出层则必须设置不同id
			title:"",				//标题 默认无
			content:"text:内容", 	//内容 text:文本 url:url iframe:iframe
			width:"",				//宽 可选 默认自适应	
			height:"",				//高 可选 默认自适应
			mask:true,			//是否显示遮罩 可选 默认显示 true=>显示 false=>不显示
			confirmBtn:false,  		//是否显示确定按钮
			cancelBtn:false,		//是否显示取消按钮
            confirmBtnText:"",      //确认按钮文本
            cancelBtnText:"",       //取消按钮文本
            showClose:true,         //是否显示右上角关闭×，默认true
            autoClose:false, 		//是否自动关闭
			onloadCallback:null,	//弹窗内容加载完成回调函数
			confirmCallback:null,	//确定按钮回调函数
			cancelCallback:null,	//取消按钮回调函数
			closeCallback:null,		//弹出层关闭回调函数
			autoCloseTime:3000		//自动关闭时间
		},options);	
		
		//如果已经存在
		if($('#'+o.id).length) return;

		//按钮
        var btnHTML='',confirmBtn,cancelBtn;
		confirmBtn = o.confirmBtn ? '<button class="confirm">'+(o.confirmBtnText ? o.confirmBtnText : '确定')+'</button>' : '';
		cancelBtn = o.cancelBtn ? '<button class="cancel">'+(o.cancelBtnText ? o.cancelBtnText : '取消')+'</button>' : '';
		if(o.confirmBtn || o.cancelBtn){
			btnHTML = '<div class="popBtn">'+cancelBtn+confirmBtn+'</div>';
		}

		//将弹窗框架添加到页面
		$("body").append('<div class="m-popup" id="'+o.id+'">'+
                            (o.mask ? '<div class="popMask"></div>' : '')+
							'<div class="popInner">'+
                                (o.title ? '<div class="popTit">'+o.title+'</div>' : '')+
                                (o.showClose ? '<a href="javascript:;" class="popClose">×</a>' : '')+
								'<div class="popCont"><p class="popLoading">正在加载...</p></div>'+
								btnHTML+
							'</div>'+
						'</div>');
		//获取弹窗元素
		var popup = $('#'+o.id),
            popInner = popup.find('.popInner'),
			popCont = popup.find('.popCont'),
			popTit = popup.find('.popTit'),
            hasTit = popTit.length,
			popBtn = popup.find('.popBtn'),
            hasBtn = popBtn.length,
            type = o.content.substring(0, o.content.indexOf(":")), //内容类型
		    content = o.content.substring(o.content.indexOf(":")+1, o.content.length); //内容

        popup.css({visibility: 'hidden', opacity:0});

		switch(type){
			case 'text': //文本
				popCont.html(content);
                if($.isFunction(o.onloadCallback)) o.onloadCallback();
				setPos();
				autoClose();	
				break;
			case 'img': //图片
                $('<img src='+content+'>').on('load', function(){
					popCont.html( $(this) );
                    if($.isFunction(o.onloadCallback)) o.onloadCallback();
					setPos();
				});
				break;
			case 'iframe': //iframe
				popCont.html('<iframe src="'+content+'" scrolling="auto" id="j-popIframe" frameborder="0" width="0" height="0"></iframe><p class="popLoading">正在加载..</p>');

				$("#j-popIframe").on('load', function(){
					$(this).css({width:o.width, height:o.height}).siblings("p").remove();
					if($.isFunction(o.onloadCallback)) o.onloadCallback();
				});
				setPos();
				break;
			default:
				popCont.html("<p class='popError'>请指定内容类型！</p>");
				setPos();
		}
		
		//设置弹出层居中显示
		function setPos(){
			var winW = $(window).width(),
				winH = $(window).height(),
				titH = hasTit && popTit.height() || 0, //tit高
				btnH = hasBtn && popBtn.height() || 0; //btn高
			
			var contW = (o.width && parseInt(o.width) ) || popCont.width(), //内容宽
				contH = (o.height && parseInt(o.height) ) || popCont.height(); //内容高
			var resH = contH + titH + btnH; //弹出层总高

			var l = ( winW - contW )/2, t = ( winH - resH )/2;

            popCont.css({ height:contH});
            popInner.css({width:contW, height:resH, left:l, top:t});
            popup.css({visibility: 'visible', opacity:1});
		}

        var timer = null;
		$(window).on('resize', function(){
            clearTimeout(timer);
			timer = setTimeout(function(){
				if(popup.length) setPos(o);
			},100);
		});

        //标题拖拽
        popTit.length && popTit.mousedown(function(event){
            //此div用来修复弹出类型为iframe拖拽bug
            $("body").append("<div id='j-flagDIV' style='width:100%; height:100%; position:fixed; top:0; left:0; background:#ccc; z-index:999999; opacity:0; filter:alpha(opacity=0);'></div>");

            var disx = event.clientX - $(this).offset().left;
            var disy = event.clientY - $(this).offset().top;
            $(document).on('mousemove', function(event){
                var lf = event.clientX - disx;
                var t = event.clientY - disy - $(this).scrollTop();
                if(t<0) t=0;
                popInner.css({left:lf,top:t});
            });
            $(document).on('mouseup', function(){
                $(this).off("mousemove mouseup");
                $("#j-flagDIV").remove();
            });
            return false;
        });

		//绑定关闭弹出层事件
		popup.on("click", ".popClose, .cancel, .confirm", function(e){
			if( $(this).hasClass("cancel") ){ //取消按钮
				if($.isFunction(o.cancelCallback)) o.cancelCallback();
				popClose();
			}else if( $(this).hasClass("confirm") ){ //确定按钮
				var flag;
				if(popup.find('.pop_error').length){
					popClose();
					return;
				}
				if($.isFunction(o.confirmCallback)) flag = o.confirmCallback();
				if(flag !== false) popClose();
			}else{
				popClose();
			}
			e.preventDefault();
		});
		
		//关闭弹窗	
		function popClose(){
			popup.remove();

			if($.isFunction(o.closeCallback)) o.closeCallback();
		}
		
		//自动关闭
		function autoClose(){
			if(o.autoClose){ 
				setTimeout(function(){
					popClose();	
				}, o.autoCloseTime);
			}
		}
		
		//对外提供重定位&关闭方法
		return {
			set : function(){
				setPos(o);
			},
			close : function(){
				popClose();
			}
		};
	};

    $.popTipsBox = function(json){
        /*
         * @description: 提示类弹出层
         * @param: json json对象
         * json属性：
         * info=>str 提示内容
         * type=>0 | 1 默认false应用操作成功样式, 设为true时应用错误提示样式
         * autoClose=>true | false 是否自动关闭 默认false
         * autoCloseTime=>number 自动关闭时间(ms) autoClose为true时生效
         */
        var tips = $.extend({info:"提示内容", type:0, autoClose:true, autoCloseTime:2000, showClose:true}, json);
        var html = '<div class="popTips '+(tips.type ? 'popTips2' : '')+'">'+tips.info+'</div>';

        if(tips.type == 3){
            html = '<div class="f-loading"><div class="info"><i></i>'+tips.info+'</div></div>';
            tips.autoClose = false;
            tips.showClose = false;
        }

        $.popup({
            id : "j-popTipsBox",
            content : 'text:'+html,
            autoClose : tips.autoClose,
            autoCloseTime : tips.autoCloseTime,
            showClose : tips.showClose,
            mask : tips.type == 3
        });

    };

    $.removeTipsBox = function(){
        $('#j-popTipsBox').remove();
    }
})(jQuery);


