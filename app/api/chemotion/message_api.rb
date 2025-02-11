# frozen_string_literal: true

module Chemotion
  # Publish-Subscription MessageAPI
  class MessageAPI < Grape::API
    resource :messages do
      desc 'Get message configuration'
      get 'config' do
        { messageEnable: ENV['MESSAGE_ENABLE'] || 'true',
          messageAutoInterval: (ENV['MESSAGE_AUTO_INTERNAL'] || 6000).to_i,
          idleTimeout: (ENV['MESSAGE_IDLE_TIME'] || 12).to_i }
      end

      desc 'Return messages of the current user'
      params do
        requires :is_ack, type: Integer, desc: 'whether messages are acknowledged or not'
      end
      get 'list' do
        messages = NotifyMessage.where(receiver_id: current_user.id)
        messages = messages.where(is_ack: params[:is_ack]) if params[:is_ack] < 9
        message_list = present(messages, with: Entities::MessageEntity, root: 'messages')

        message_list[:version] = ENV['VERSION_ASSETS'] if ENV['VERSION_ASSETS']

        Notification.where(
          id: messages.where(channel_type: 5).pluck(:id)
        ).each do |notification|
          notification.update!(is_ack: 1)
        end
        message_list
      end

      desc 'Return spectra messages of the current user'
      params do
        requires :is_ack, type: Integer, desc: 'messages is acknowledged or not'
      end
      get 'spectra' do
        messages = NotifyMessage.where(receiver_id: current_user.id, subject: 'Chem Spectra Notification')
        messages = messages.where(is_ack: params[:is_ack]) if params[:is_ack] < 9
        messages.where(channel_type: 8).each do |msg|
          Notification.find(msg.id)&.update!(is_ack: 1)
        end
        messages
      end

      desc 'Return channels'
      params do
        requires :channel_type, type: Integer, desc: '9: system; 8: system user'
      end
      get 'channels' do
        channels = Channel.where(channel_type: params[:channel_type])
        present channels, with: Entities::ChannelEntity, root: 'channels'
      end

      desc 'Return channels by current_user'
      get 'channels_user' do
        channels = Channel.where(channels: 8)
                          .select(
                            <<~SQL
                              id, subject, created_at, updated_at, msg_template,
                              (select user_id from subscriptions
                              where channel_id = channels.id
                              and user_id = #{current_user.id} limit 1) as user_id
                            SQL
                          )
        present channels, with: Entities::ChannelEntity, root: 'channels'
      end

      desc 'get Individual users notification channel'
      get 'channel_individual' do
        Channel.find_by(subject: Channel::SEND_INDIVIDUAL_USERS)
      end

      namespace :ack do
        desc 'acknowledged message by current user'
        params do
          requires :ids, type: Array, desc: 'notification ids'
        end
        put do
          return if params[:ids].nil?

          notifs = Notification.find(params[:ids])
          params_arr = { is_ack: 1 }
          notifs.each do |notif|
            next if notif.user_id != current_user.id

            notif.update!(params_arr)
          end
        end
      end

      namespace :subscribe do
        desc 'subscribe and unsubscribe a channel by current user'
        params do
          requires :channel_id, type: Integer, desc: 'channel id'
          requires :subscribe, type: Boolean, desc: 'true: subscribe; false: unscribe'
        end
        post do
          channel = Channel.find(params[:channel_id])
          return if channel.nil?

          if params[:subscribe]
            sub_attr = {
              channel_id: channel.id,
              user_id: current_user.id
            }
            Subscription.create(sub_attr)
          else
            Subscription.find_by(channel_id: channel.id, user_id: current_user.id).destroy
          end
        end
      end

      namespace :new do
        desc 'new system message'
        params do
          requires :channel_id, type: Integer, desc: 'channel id'
          requires :content, type: String, desc: 'message content'
          optional :user_ids, type: Array, desc: 'notification user ids'
        end
        post do
          message = Message.create_msg_notification(
            channel_id: params[:channel_id],
            message_content: { 'data': params[:content] },
            message_from: current_user.id,
            message_to: params[:user_ids]
          )
          { message: message }
        end
      end

      namespace :subscribe do
        desc 'subscribe a channel'
        params do
          requires :channel_id, type: Integer, desc: 'notification ids'
        end
        post do
          channel = Channel.find(params[:channel_id])
          subscribe_attr = {
            channel_id: channel.id,
            user_id: current_user.id
          }
          Subscription.create(subscribe_attr)
        end
      end
    end
  end
end
