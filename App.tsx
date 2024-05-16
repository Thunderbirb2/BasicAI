import React, { useState, Component } from 'react';
import { Text, ScrollView, TextInput, Button, StyleSheet, View, TouchableOpacity, LogBox  } from 'react-native';

import Tts from 'react-native-tts';
import Voice, {
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';

import { getResponse, textToGoogleSearchURL } from './AIService';
import { getPrunedHtml } from './GoogleHandler'; // Import the function for fetching and parsing HTML

type Props = {};
type State = {
  recognized: string;
  pitch: string;
  error: string;
  end: string;
  started: string;
  results: string[];
  partialResults: string[];
  messages: string[];
  userInput: string;
  sendButtonAvailable: boolean;
  keepTalk: boolean;
};

LogBox.ignoreLogs(['`new']);
LogBox.ignoreLogs(['TTS']);
const App = (): React.JSX.Element => {
  Tts.setDefaultLanguage('en-US');
  return (
    <VoiceTest></VoiceTest>
  );
};

class VoiceTest extends Component<Props, State> {
  scrollViewRef: any;

  state = {
    recognized: '',
    pitch: '',
    error: '',
    end: '',
    started: '',
    results: [],
    partialResults: [],
    messages: [],
    userInput: '',
    sendButtonAvailable: true,
    keepTalk: false,
  };

  constructor(props: Props) {
    super(props);
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
    Voice.onSpeechPartialResults = this.onSpeechPartialResults;
    Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged;
  }

  //calls Tts.speak
  sayThis = async (text: string) => {
    try {
      await Tts.speak(text);
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  //start the spoken interaction with the AI
  startConversation = async () => {
    Tts.setDefaultLanguage('en-US');
    if (this.state.keepTalk) {
      this.setState(({
        keepTalk: false
      }));
      this._stopRecognizing()
      this._cancelRecognizing()
      this._destroyRecognizer()
      return;
    } else {
      this.setState(({
        keepTalk: true
      }));
      await this._startRecognizing()
    }
  }

  //sends the written message to the AI
  sendSingleMessage = async () => {
    this.sendMessage(false, "");
  }

  //sends the spoken message to the AI
  sendMessage = async (loop: boolean, message: string) => {
    if (!this.state.userInput && !loop) return;
    if (loop) {
      this.setState(prevState => ({
        userInput: '',
        messages: [...prevState.messages, ` ${message}`],
      }));
      const botResponse = await this.generateResponse(message,loop);
      this.setState(prevState => ({
        messages: [...prevState.messages, `🤖 ${botResponse}`],
      }));
      await this.sayThis(botResponse);
      await new Promise(resolve => setTimeout(resolve, this.delayCalculator(botResponse)));
    } else {
      this.setState(prevState => ({
        userInput: '',
        messages: [...prevState.messages, ` ${prevState.userInput}`],
        sendButtonAvailable: false,
      }));
      const botResponse = await this.generateResponse(this.state.userInput,loop);
      this.setState(prevState => ({
        messages: [...prevState.messages, `🤖 ${botResponse}`],
      }));
    }
    if (loop && this.state.keepTalk) {
      this._startRecognizing()
    } else {
      this.setState(({
        sendButtonAvailable: true,
      }));
    }
  };

  //calculates how much time is needed to wait until tts finishes
  delayCalculator = (inputText: string) => {
    let letters = 0;
    let numbers = 0;
    for (let i = 0; i < inputText.length; i++) {
      if (/[a-zA-Z]/.test(inputText[i])) {
        letters++;
      } else if (/[0-9]/.test(inputText[i])) {
        numbers++;
      }
    }
    return (letters + (numbers) * 6) * 100;
  };

  //capitalizes the first letter of a string
  capitalize = (str: String) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  //sends a message to the AI that asks for different tags depending on the response. 
  //If the AI can respond normally, it will. If not, it will help the AI google information
  generateResponse = async (message: string,loop: boolean) => {
    //console.log(message)
    let upgradedMessage = "Respond to the message: '" + message + "'. Important: If you can't answer real-time access to the internet, " +
      "say the text you would google to find the answer surrounded by <URL>. If you can answer, surround you answer by" +
      " <ANSWER>. Follow these instructions and remember the context of this whole conversation."
    try {
      let response = await getResponse(upgradedMessage);
      //console.log("Raw response: " + response)
      if (response.includes("<URL>")) {
        this.setState(prevState => ({
          messages: [...prevState.messages, `🤖 Let me look it up...`]
        }));
        if (loop) {
        await this.sayThis(`Let me look it up`)
        }
        response = this.processResponse(response)
        response = textToGoogleSearchURL(response)
        //console.log("I'll look it up: " + response)
        let newResponse = await this.googleSearch(message, response, 1, loop)
        return newResponse;
      } else if (response.includes("<ANSWER>")) {
        response = this.processResponse(response)
        //console.log("Here is my answer: " + response)
        return response;
      } else {
        return "I had a problem answering: " + response;
      }
    } catch (error) {
      return "I had an error while answering: " + error;
    }
  }

  //processes the answer from the AI removing the tags
  processResponse = (text: string) => {
    let index = text.indexOf("<URL>");
    if (index !== -1) {
      text = text.slice(index + "<URL>".length);
    }
    index = text.indexOf("</URL>");
    if (index !== -1) {
      text = text.slice(0, index);
    }
    index = text.indexOf("<ANSWER>");
    if (index !== -1) {
      text = text.slice(index + "<ANSWER>".length);
    }
    index= text.indexOf("</ANSWER>");
    if (index !== -1) {
      text = text.slice(0, index);
    }
    return text;
  }

  //get content from a website and gives it to the AI. If the AI needs more information, it asks for another website the function calls 
  //itself and gives the content from the new website. It will look up five websites before giving up 
  googleSearch = async (message: string, url: string, count: number, loop: boolean): Promise<string> => {
    if (count == 5) {
      return "I couldn't find the answer.";
    }
    const html = await getPrunedHtml(url)
    let upgradedMessage = "Respond to the message: '" + message + "' using this data: '" + html + "'. Important: If you can't answer, " +
      "say an url from the data that could help to find the answer and surround it by <URL>. If you can answer, surround you answer by" +
      " <ANSWER>. Follow these instructions and remember the context of this whole conversation."
    try {
      let response = await getResponse(upgradedMessage);
      //console.log("Raw response: " + response)
      if (response.includes("<URL>")) {
        response = this.processResponse(response)
        //console.log("I'm still looking: " + response)
        this.setState(prevState => ({
          messages: [...prevState.messages, `🤖 I'm still looking for the answer...`]
        }));
        if (loop) {
        await this.sayThis(`I'm still looking for the answer`)
        }
        let newResponse = await this.googleSearch(message, response, count++,loop)
        return newResponse;
      } else if (response.includes("<ANSWER>")) {
        response = this.processResponse(response)
        //console.log("I found the answer: " + response)
        return response;
      } else {
        return "I had a problem looking for an answer: " + response;
      }
    } catch (error) {
      return "I had an error while answering: " + error;
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <ScrollView
          ref={ref => this.scrollViewRef = ref}
          style={styles.messageContainer}
          onContentSizeChange={() => this.scrollViewRef.scrollToEnd({ animated: true })}
        >
          {this.state.messages.map((msg, index) => (
            <View key={index} style={(msg as string).startsWith("🤖") ? styles.leftMessageContainer : styles.rightMessageContainer}>
              <Text style={(msg as string).startsWith("🤖") ? styles.leftMessageText : styles.rightMessageText}>{msg}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TouchableOpacity style={this.state.keepTalk === false ? styles.buttonBlue : styles.buttonRed} onPress={this.startConversation}>
            <Text style={styles.symbolStyle} >💬</Text>
          </TouchableOpacity>
          <TextInput
            value={this.state.userInput}
            onChangeText={(text) => this.setState({ userInput: text })}
            placeholder="Type a message"
            style={styles.inputStyle} // updated style here
          />
          <Button title="Send" onPress={this.sendSingleMessage} disabled={!this.state.sendButtonAvailable} />
        </View>
      </View>
    );
  }

  //@react-native-voice/voice function
  componentWillUnmount() {
    Voice.destroy().then(Voice.removeAllListeners);
  }

  //@react-native-voice/voice function
  handleListening = () => {
    this._startRecognizing();
    Voice.onSpeechResults = (e) => {
    };
  };

  //@react-native-voice/voice function
  onSpeechStart = (e: any) => {
    this.setState({
      started: '√',
    });
  };

  //@react-native-voice/voice function
  onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    this.setState({
      recognized: '√',
    });
  };

  //@react-native-voice/voice function
  onSpeechEnd = (e: any) => {
    this.setState({
      end: '√',
    });
  };

  //@react-native-voice/voice function
  onSpeechError = (e: SpeechErrorEvent) => {
    this.setState({
      error: JSON.stringify(e.error),
    });
    if (this.state.keepTalk) {
      this._startRecognizing()
    } else {
      this.setState(({
        sendButtonAvailable: true,
      }));
    }
  };

  //@react-native-voice/voice function
  onSpeechResults = (e: SpeechResultsEvent) => {
    this.setState({
      results: e.value!,
    });
    this.sendMessage(true, this.capitalize(e.value![0]));
  };

  //@react-native-voice/voice function
  onSpeechPartialResults = (e: SpeechResultsEvent) => {
    this.setState({
      partialResults: e.value!,
    });
  };

  //@react-native-voice/voice function
  onSpeechVolumeChanged = (e: any) => {
    this.setState({
      pitch: e.value,
    });
  };

  //@react-native-voice/voice function
  _startRecognizing = async () => {
    this.setState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
      sendButtonAvailable: false,
    });

    try {
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
    }
  };

  //@react-native-voice/voice function
  _stopRecognizing = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
  };

  //@react-native-voice/voice function
  _cancelRecognizing = async () => {
    try {
      await Voice.cancel();
    } catch (e) {
      console.error(e);
    }
  };

  //@react-native-voice/voice function
  _destroyRecognizer = async () => {
    try {
      await Voice.destroy();
    } catch (e) {
      console.error(e);
    }
    this.setState({
      recognized: '',
      pitch: '',
      error: '',
      started: '',
      results: [],
      partialResults: [],
      end: '',
    });
  };

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  messageContainer: {
    flex: 1,
    marginBottom: 50, // adjust as needed to accommodate input container
  },
  leftMessageContainer: {
    alignSelf: 'flex-start',
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
  },
  rightMessageContainer: {
    alignSelf: 'flex-end',
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 10,
  },
  leftMessageText: {
    color: 'black', // or any other color you prefer
  },
  rightMessageText: {
    color: 'white', // or any other color you prefer
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#eee',
    position: 'absolute', // positioning at the bottom
    bottom: 0, // stick to the bottom
    left: 0,
    right: 0,
  },
  inputStyle: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#fff',
    color: '#000', // Set text color to black
  },
  symbolStyle: {
    color: 'white',
    fontSize: 20
  },
  buttonBlue: {
    width: 40,
    height: 40,
    borderRadius: 20, // make it circle
    backgroundColor: '#1e90ff', // or any color you prefer
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  buttonRed: {
    width: 40,
    height: 40,
    borderRadius: 20, // make it circle
    backgroundColor: 'red', // or any color you prefer
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
});

export default App;