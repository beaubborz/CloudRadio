#include "Radio.h"
#include <iostream>

Radio::Radio()
{
	//load the VLC engine
	this->_inst = libvlc_new(0, NULL);
	_isPaused = false;
	_mp = libvlc_media_player_new(_inst);
	_path = "";
}

void Radio::play()
{
	if(_path.size()>0)
		libvlc_media_player_play(_mp);
	_isPaused = false;
}

void Radio::pause()
{
	if(!_isPaused)
	{
		libvlc_media_player_pause(_mp);
		_isPaused = true;
	}
}

void Radio::stop()
{
	libvlc_media_player_stop(_mp);
}

void Radio::setSong(std::string path)
{	
	this->stop();

	if(fopen(path.c_str(), "r") == NULL)
	{
		std::cerr<<"File: "<<path.c_str()<<" doesnt exists!"<<std::endl;
		return;
	}

	libvlc_media_t* media = libvlc_media_new_path(_inst, path.c_str());

	if(media == NULL)
	{
		std::cerr<<"Error while leading file: "<<path.c_str()<<std::endl<<libvlc_errmsg()<<std::endl;
		return;
	}

	libvlc_media_player_set_media(_mp, media);
	this->_path = path;

	libvlc_media_release(media);
}


void Radio::setSongEndedCallback(libvlc_callback_t callback)
{
	//setup the event callback
	libvlc_event_attach(libvlc_media_player_event_manager(_mp), libvlc_MediaPlayerEndReached, callback, NULL);
}

void Radio::setProgressCallback(libvlc_callback_t callback)
{
	//setup the event callback
	libvlc_event_attach(libvlc_media_player_event_manager(_mp), libvlc_MediaPlayerPositionChanged, callback, NULL);
}

Radio::~Radio()
{
	// stop playing
	stop();
	// free the media_player
	libvlc_media_player_release(_mp);
	_mp = NULL;
	libvlc_release(_inst);
}