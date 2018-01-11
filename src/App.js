import React from 'react';
import VideoPlayer from './VideoPlayer';
import './App.css';

class App extends React.Component {
    render() {
        const videoJsOptions = {
            autoplay: true,
            controls: true,
            sources: [{
                src: '//vjs.zencdn.net/v/oceans.mp4',
                type: 'video/mp4'
            }, {
                src: '//vjs.zencdn.net/v/oceans.webm',
                type: 'video/webm'
            }, {
                src: '//vjs.zencdn.net/v/oceans.ogv',
                type: 'video/ogg'
            }]
        };
        return <VideoPlayer {...videoJsOptions} />;
    }
}

export default App;
