import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axiosHttp from '../utils/requestInterceptor';
import { recieveMessageRoute, sendMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, userInfo, socket, arrivedMessage }) {
  const [chatMessages, setChatMessages] = useState([]);
  // doing this because https://medium.com/@kishorkrishna/cant-access-latest-state-inside-socket-io-listener-heres-how-to-fix-it-1522a5abebdb
  // we cannot access the latest state of component inside callbacks.
  const notificationSound = new Audio('/chat-sound.mp3');
  const scrollRef = useRef();
  
  useEffect(() => {
    if(currentChat) {
      getUserMessage();
    }
  }, [currentChat]);

  useEffect(() => {
    if(arrivedMessage && arrivedMessage.from === currentChat._id){
        notificationSound.play();
        const newMessage = {fromSelf: false, message: arrivedMessage.message}
        setChatMessages(prevState => [...prevState, newMessage]);
      }
  },[arrivedMessage])

  const getUserMessage = async () => {
    const response = await axiosHttp.post(recieveMessageRoute, {
      from: userInfo._id,
      to: currentChat._id,
    });
    setChatMessages(response.data.messages);
  }

  const handleSendMsg = async (message) => {
    socket.current.emit("message-send", {
      to: currentChat._id,
      from: userInfo._id,
      message,
    });
    await axiosHttp.post(sendMessageRoute, {
      from: userInfo._id,
      to: currentChat._id,
      message,
    });

    const msgs = [...chatMessages];
    msgs.push({ fromSelf: true, message });
    setChatMessages(msgs);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {chatMessages.map((message) => {
          return (
            <div ref={scrollRef} key={uuidv4()}>
              <div
                className={`message ${
                  message.fromSelf ? "sended" : "recieved"
                }`}
              >
                <div className="content ">
                  <p>{message.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;