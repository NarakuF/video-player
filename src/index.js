import React from 'react';
import ReactDOM from 'react-dom';
import VideoPlayer from './VideoPlayer';
import './index.css';

const videoJsOptions = {
    autoplay: true,
    controls: true,
    sources: [{ src: '//vjs.zencdn.net/v/oceans.mp4' }],
    width: "800",
    height: "600",
};

ReactDOM.render(<VideoPlayer {...videoJsOptions} />, document.getElementById('root'));

//vjs.zencdn.net/v/oceans.mp4