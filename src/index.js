import React from 'react';
import ReactDOM from 'react-dom';
import VideoPlayer from './VideoPlayer';
import './styles/styles.css';

const videoJsOptions = {
    autoplay: true,
    controls: true,
    preload: 'auto',
    sources: [{src: '//vjs.zencdn.net/v/oceans.mp4'}],
    width: '1056',
    height: '594',
    playbackRates: [0.75, 1, 1.25, 1.5, 2, 5],
    controlBar: {
        volumePanel: {inline: false}
    },
};

ReactDOM.render(<VideoPlayer {...videoJsOptions} />, document.getElementById('root'));