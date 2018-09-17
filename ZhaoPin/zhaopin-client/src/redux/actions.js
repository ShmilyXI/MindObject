/*
包含n个action creator
异步action
同步action
*/
import {
  AUTH_SUCCESS,
  ERROR_MSG,
  RECEIVE_USER,
  RESET_USER,
  RECEIVE_USER_LIST,
  RECEIVE_MSG_LIST,
  RECEIVE_MSG
} from './action-types'
import {
  reqRegister,
  reqLogin,
  reqUpdateUser,
  reqUser,
  reqUserList,
  reqChatMsgList,
  reqReadMsg
} from '../api'
import io from 'socket.io-client'

/*
  单例对象
    1.创建对象之前:判断对象是否已经存在,只有不存在才去创建
    2.创建对象之后:保存对象
*/

function initIO(dispatch,userid) {
  if(!io.socket){
    console.log('initIO启动');
    //连接服务器,得到与服务器的连接对象
    io.socket = io('ws://localhost:4000')
    //绑定监听,接收服务器发送的消息
    io.socket.on('receiveMsg',function (chatMsgs) {
      console.log('接收服务器发送的消息:',chatMsgs);
      //只有chatMsgs是当前用户的消息时,才去分发同步action消息
      if(userid ===chatMsgs.from || userid ===chatMsgs.to){
        dispatch(receiveMsg(chatMsgs))
      }
    })
  }
  
}
//发送消息的异步action
export const sendMsg=({from,to,content})=>{
  return dispatch =>{
    console.log('发送消息',{from,to,content});
    io.socket.emit('sendMsg',{from,to,content})
  }
}


//授权成功的同步action
const authSuccess = (user)=>({type:AUTH_SUCCESS,data:user})
//错误提示信息的同步action
const errorMsg = (msg)=>({type:ERROR_MSG,data:msg})
//接受用户的同步action
const receiveUser = (user)=>({type:RECEIVE_USER,data:user})
//更新用户的同步action
export const resetUser = (msg)=>({type:RESET_USER,data:msg})
//接收用户列表的同步action
const receiveUserList = (userlist)=>({type:RECEIVE_USER_LIST,data:userlist})
//接收消息列表的同步action
const receiveMsgList = ({users,chatMsgs})=>({type:RECEIVE_MSG_LIST,data:{users,chatMsgs}})
//接收一条消息的同步action
const receiveMsg = (chatMsgs) =>({type:RECEIVE_MSG,data:chatMsgs})

//异步获取消息列表数据
async function getMsgList(dispatch,userid) {
  const response = await reqChatMsgList()
  const result = response.data
  if(result.code===0){
    initIO(dispatch,userid)
    const {users,chatMsgs} = result.data
    //分发同步action
    dispatch(receiveMsgList({users,chatMsgs}))
  }
}

//注册异步action
export const register = (user) =>{
  const {username,password,password2,type} = user
  //做表单的前台检查,如果不通过,返回一个errorMsg的同步action
  if(!username){
    return errorMsg('用户名不能为空!!!')
  }else if(!password){
    return errorMsg('密码不能为空!!!')
  }else if(password2!==password){
    return errorMsg('两次密码不一致!!!')
  }else if(username===password){
    return errorMsg('用户名不能与密码相同!!!')
  }
  //表单数据合法,返回一个发ajax请求的异步action函数
  return async dispatch =>{
    //发送注册的异步ajax请求
    const response = await reqRegister({username,password,type})
    const result = response.data //{code:0/1,data:user,msg:''}
    if(result.code===0){//成功
      getMsgList(dispatch,result.data._id)
      //分发授权成功的同步action
      dispatch(authSuccess(result.data))
    }else{//失败
      //分发错误提示信息的同步action
      dispatch(errorMsg(result.msg))
    }
  }
}

//登录异步action
export const login = (user) =>{
  const {username,password} = user
  //做表单的前台检查,如果不通过,返回一个errorMsg的同步action
  if(!username){
    return errorMsg('用户名不能为空!!!')
  }else if(!password){
    return errorMsg('密码不能为空!!!')
  }
  return async dispatch =>{
    //发送登录的异步ajax请求
    const response = await reqLogin(user)
    const result = response.data
    if(result.code===0){//成功
      getMsgList(dispatch,result.data._id)
      //分发授权成功的同步action
      dispatch(authSuccess(result.data))
    }else{//失败
      //分发错误提示信息的同步action
      dispatch(errorMsg(result.msg))
    }
  }
}

//更新用户信息的异步action
export const updateUser=(user) =>{
    return async dispatch =>{
      const response =await reqUpdateUser(user)
      const result = response.data
      if(result.code===0){//更新成功
        dispatch(receiveUser(result.data))
      }else{//更新失败
        dispatch(resetUser(result.msg))
      }
    }
}

//获取用户信息的异步action
export const getUser = ()=>{
  return async dispatch=>{
    const response = await reqUser()
    const result = response.data
    if(result.code===0){//成功
      getMsgList(dispatch,result.data._id)
      dispatch(receiveUser(result.data))
    }else{//失败
      dispatch(resetUser(result.msg))
    }
  }
}

//获取用户列表的异步action
export const getUserList=(type)=>{
  return async dispatch=>{
    const response = await reqUserList(type)
    const result = response.data
    if(result.code===0){
      dispatch(receiveUserList(result.data))
    }
  }
}

