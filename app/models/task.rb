# == Schema Information
#
# Table name: tasks
#
#  id               :bigint           not null, primary key
#  status           :string           default("To do")
#  measurement_value :integer
#  measurement_unit  :string           default("s"), not null
#  description      :string
#  private_note     :string
#  additional_note  :string
#  created_at       :datetime         not null
#  created_by       :integer          not null
#  updated_at       :datetime
#  sample_id        :bigint
#
# Indexes
#
#  index_tasks_on_sample_id  (sample_id)
#
# Foreign Keys
#
#  fk_rails_...  (sample_id => samples.id)
#

class Task < ApplicationRecord
  belongs_to :creator, foreign_key: :created_by, class_name: 'User'
  belongs_to :sample, foreign_key: :sample_id, optional: false
end
