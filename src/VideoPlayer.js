import React from 'react';
import videojs from 'video.js';
import videojsYoutube from 'videojs-youtube';

export default class VideoPlayer extends React.Component {
    constructor(props) {
        super(props);
        this.handleSourceChange = this.handleSourceChange.bind(this);
    }

    componentDidMount() {
        // instantiate Video.js
        this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
            console.log('onPlayerReady', this);
        });
    }

    // destroy player on unmount
    componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
    }

    handleSourceChange(event) {
        event.preventDefault();
        let url = event.target.elements.source.value;
        if (url.substring(url.length - 3) == "mp4") {
            this.player.src({ type: 'video/mp4', src: url });
        }
        else if (url.includes("www.youtube.com")) {
            this.player.src({ type: 'video/youtube', src: url });
        }
        else {
            this.player.src({});
        }
    }

    render() {
        return (
            <div className="row">
                <form className="form-inline col-md-12 my-3" onSubmit={this.handleSourceChange}>
                    <input type="text" className="form-control w-75 mr-auto" name="source"/>
                    <button className="btn btn-primary" type="submit">Submit</button>
                </form>
                <div data-vjs-player className="col-md-12">
                    <video ref={node => this.videoNode = node} className="video-js"></video>
                </div>
            </div>
        )
    }
}